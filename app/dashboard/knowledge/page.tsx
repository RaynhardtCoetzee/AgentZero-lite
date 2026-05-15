import type { Metadata } from "next";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { KnowledgePageContent, type DocRow } from "./_components/KnowledgePageContent";

export const metadata: Metadata = { title: "Knowledge — AgentZero" };

export default async function KnowledgePage() {
  const session = await auth();
  const orgId   = session?.user?.orgId ?? "";

  let documents: DocRow[] = [];
  if (orgId) {
    const { data } = await adminClient
      .from("documents")
      .select("id, file_name, file_type, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    documents = (data ?? []) as DocRow[];
  }

  return <KnowledgePageContent documents={documents} orgId={orgId} />;
}
