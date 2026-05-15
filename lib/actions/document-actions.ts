"use server";

/**
 * lib/actions/document-actions.ts — Document Upload Server Action
 *
 * Pipeline:
 *   FormData → validate → extract text → chunk → embed → insert document
 *             → store chunks → return result
 *
 * Rollback guarantee:
 *   If chunk storage fails after the document row is created, the document
 *   row is deleted so no orphaned record is left behind.
 *
 * Auth:
 *   Uses auth() from Auth.js v5 — awaited per Next.js 16 async-first rules.
 *   orgId and userId are read from the JWT-backed session (no extra DB call).
 */

import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { generateEmbedding, storeChunks } from "@/lib/ai/embeddings";
import { z } from "zod";
// unpdf is built for serverless/Node.js — no external worker file needed.
import { extractText } from "unpdf";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES  = ["application/pdf", "text/plain", "text/markdown"] as const;
const CHUNK_SIZE     = 500; // characters per chunk
const CHUNK_OVERLAP  = 50;  // characters of overlap between adjacent chunks

// ---------------------------------------------------------------------------
// Zod schema — incoming file
// ---------------------------------------------------------------------------

const fileSchema = z
  .instanceof(File)
  .describe(
    "The uploaded file. Must be a non-empty PDF, TXT, or MD file under 10 MB."
  )
  .refine((f) => f.size > 0, {
    message: "File is empty.",
  })
  .refine((f) => f.size <= MAX_FILE_BYTES, {
    message: "File exceeds the 10 MB size limit.",
  })
  .refine((f) => {
    const isAllowedType = (ALLOWED_TYPES as readonly string[]).includes(f.type);
    const isMdFile = f.name.toLowerCase().endsWith('.md');
    const isTextType = f.type.startsWith('text/');
    return isAllowedType || isMdFile || isTextType;
  }, {
    message: "Unsupported file type. Accepted: PDF, TXT, MD.",
  });

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type UploadDocumentResult =
  | { success: true;  documentId: string; chunkCount: number }
  | { success: false; error: string };

export type ListDocumentsResult =
  | { ok: true;  documents: Array<{ id: string; file_name: string; file_type: string }> }
  | { ok: false; error: string };

export async function listOrgDocuments(): Promise<ListDocumentsResult> {
  const session = await auth();
  if (!session?.user?.orgId) return { ok: false, error: "Unauthorized." };

  const { data, error } = await adminClient
    .from("documents")
    .select("id, file_name, file_type")
    .eq("org_id", session.user.orgId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, documents: (data ?? []) as Array<{ id: string; file_name: string; file_type: string }> };
}

export type GetDocumentContentResult =
  | { ok: true;  content: string }
  | { ok: false; error: string };

export async function getDocumentContent(documentId: string): Promise<GetDocumentContentResult> {
  const session = await auth();
  if (!session?.user?.orgId) return { ok: false, error: "Unauthorized." };

  const { data, error } = await adminClient
    .from("documents")
    .select("content")
    .eq("id", documentId)
    .eq("org_id", session.user.orgId)
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data?.content) return { ok: false, error: "Document has no content." };

  return { ok: true, content: data.content as string };
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function uploadDocument(
  formData: FormData
): Promise<UploadDocumentResult> {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  // auth() is awaited — Next.js 16 async-first requirement.
  // JWT session carries orgId and userId; zero extra DB queries here.
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) {
    return { success: false, error: "Unauthorized." };
  }
  const { id: userId, orgId } = session.user;

  // ── 2. Extract agentId (optional — org-level uploads remain valid) ────────
  const agentId = formData.get("agentId");
  const validatedAgentId =
    typeof agentId === "string" && agentId.length > 0 ? agentId : null;

  // ── 3. Extract and validate file ──────────────────────────────────────────
  const rawFile = formData.get("file");
  if (!(rawFile instanceof File)) {
    return { success: false, error: "No file provided in form data." };
  }

  const parsed = fileSchema.safeParse(rawFile);
  if (!parsed.success) {
    // Return the first validation message — never silently coerce.
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid file.",
    };
  }
  const file = parsed.data;

  try {
    // ── 4. Extract text ─────────────────────────────────────────────────────
    let text: string;

    if (file.type === "application/pdf") {
      const { text: merged } = await extractText(
        await file.arrayBuffer(),
        { mergePages: true }, // returns a single string, not string[]
      );
      text = merged;
    } else {
      // text/plain, text/markdown, or other text types
      text = await file.text();
    }

    if (!text.trim()) {
      return { success: false, error: "File contains no extractable text." };
    }

    // ── 4. Chunk ─────────────────────────────────────────────────────────────
    const chunks = chunkText(text);

    // ── 5. Embed ──────────────────────────────────────────────────────────────
    // Sequential rather than Promise.all — avoids OpenAI rate-limit bursts on
    // large documents. Swap to Promise.all if throughput becomes a bottleneck
    // and you have a higher-tier API plan with raised RPM limits.
    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      embeddings.push(await generateEmbedding(chunk));
    }

    // ── 6. Insert document row ────────────────────────────────────────────────
    const { data: docData, error: docError } = await adminClient
      .from("documents")
      .insert({
        user_id:   userId,
        org_id:    orgId,
        agent_id:  validatedAgentId,
        file_name: file.name,
        file_type: file.type,
        content:   text,
      })
      .select("id")
      .single();

    if (docError || !docData) {
      throw new Error(
        `Failed to create document record: ${docError?.message ?? "no data returned"}`
      );
    }

    const documentId = docData.id as string;

    // ── 7. Store chunks (with rollback on failure) ────────────────────────────
    try {
      await storeChunks(
        chunks.map((content, i) => ({
          content,
          embedding:  embeddings[i],
          documentId,
        })),
        orgId,
        adminClient
      );
    } catch (chunkError) {
      // Rollback: remove the orphaned document row so the DB stays consistent.
      await adminClient.from("documents").delete().eq("id", documentId);
      throw chunkError; // re-throw to be caught by the outer handler
    }

    return { success: true, documentId, chunkCount: chunks.length };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// chunkText — simple character-based chunking with overlap
// ---------------------------------------------------------------------------

function chunkText(
  text:    string,
  size    = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const chunk = text.slice(start, start + size).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start += size - overlap; // advance by (size - overlap) to create the window
  }

  return chunks;
}
