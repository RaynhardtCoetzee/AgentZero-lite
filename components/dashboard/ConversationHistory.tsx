// AgentZero Lite — billing layer removed
"use client";

import { useEffect, useState } from "react";
import { listConversations } from "@/lib/actions/conversation-actions";
import { ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export function ConversationHistory({
  agentId,
  onLoadConversation,
  currentConversationId,
}: {
  agentId: string;
  onLoadConversation: (convId: string) => void;
  currentConversationId: string | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await listConversations(agentId);
      if (result.ok) {
        setConversations(result.conversations);
      }
      setLoading(false);
    }
    load();
  }, [agentId, currentConversationId]);

  return (
    <div className="border-b border-border bg-muted/20 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <MessageSquare className="size-3 shrink-0" />
        History
        <span className="ml-auto text-[10px]">{conversations.length}</span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-1">
          {loading ? (
            <p className="text-[11px] text-muted-foreground/50">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/50">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => onLoadConversation(conv.id)}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-xs transition-colors",
                  currentConversationId === conv.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <p className="truncate font-mono text-[10px]">{conv.title}</p>
                <p className="text-[9px] text-muted-foreground/60">
                  {new Date(conv.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
