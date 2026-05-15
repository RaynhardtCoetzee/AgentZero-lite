'use server';

import { adminClient } from '@/lib/supabase/admin';
import { v4 as uuid } from 'uuid';

const PYTHON_PROCESSOR_URL = process.env.PYTHON_PROCESSOR_URL || 'http://localhost:8000';

interface ProcessDocumentResult {
  documentId: string;
  fileName: string;
  chunkCount: number;
  status: 'success' | 'error';
  error?: string;
}

export async function processAndStoreDocument(
  fileBytes: ArrayBuffer,
  fileName: string,
  fileType: string,
  metadata?: Record<string, unknown>
): Promise<ProcessDocumentResult> {
  const documentId = uuid();

  try {
    const supabase = adminClient;

    // Call Python processor
    const response = await fetch(`${PYTHON_PROCESSOR_URL}/process-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        fileBytes: Array.from(new Uint8Array(fileBytes)),
        fileName,
        fileType,
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Processor failed: ${response.statusText}`);
    }

    const { chunkCount } = await response.json();

    return {
      documentId,
      fileName,
      chunkCount,
      status: 'success',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      documentId,
      fileName,
      chunkCount: 0,
      status: 'error',
      error: errorMessage,
    };
  }
}

export async function getDocumentWithChunks(documentId: string) {
  const supabase = adminClient;

  const [docResult, chunksResult] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single(),
    supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_order', { ascending: true }),
  ]);

  if (docResult.error) throw docResult.error;
  if (chunksResult.error) throw chunksResult.error;

  return {
    document: docResult.data,
    chunks: chunksResult.data,
  };
}

export async function deleteDocument(documentId: string) {
  const supabase = adminClient;

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
  return { success: true };
}
