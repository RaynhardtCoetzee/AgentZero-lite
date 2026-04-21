"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createAgent } from "@/lib/actions/agent-crud-actions";

export function NewAgentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await createAgent();
    if (result.success) {
      router.push(`/dashboard/agents/${result.id}`);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 rounded-sm border border-[#c8f135]/50 px-3 py-1.5",
          "font-mono text-xs font-medium text-[#c8f135] transition-colors",
          "hover:bg-[#c8f135]/10",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {loading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Plus className="h-3 w-3" />}
        New agent
      </button>
      {error && (
        <p className="text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}
