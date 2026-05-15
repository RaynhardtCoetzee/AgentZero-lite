"use client";

/**
 * components/dashboard/ChatKanban.tsx
 *
 * Displays all conversations for an agent in a kanban-style card layout.
 * Click a card to open that conversation in the chat interface.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { listConversations, updateConversationTitle, type ConversationSummary } from "@/lib/actions/conversation-actions";
import { MessageSquare, SquarePen, Loader2, ChevronRight, Edit2, User, Sparkles } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";

type Conversation = ConversationSummary;

type ChatKanbanProps = {
  agentId: string;
  agentName: string;
  onSelectChat: (conversationId: string) => void;
  onNewChat: () => void;
};

export function ChatKanban({ agentId, agentName, onSelectChat, onNewChat }: ChatKanbanProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      setError(null);
      const result = await listConversations(agentId);
      if (result.ok) {
        setConversations(result.conversations);
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    };

    fetchConversations();
  }, [agentId]);

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveTitle = async (convId: string) => {
    if (!editingTitle.trim()) {
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    const result = await updateConversationTitle(convId, editingTitle.trim());
    setIsSaving(false);

    if (result.ok) {
      setConversations(conversations.map(c =>
        c.id === convId ? { ...c, title: editingTitle.trim() } : c
      ));
      setEditingId(null);
      setEditingTitle("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center">
        <div>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden md:rounded-md glass-1">
      {/* Single header row: breadcrumb + action */}
      <div className="flex items-center gap-1.5 shrink-0 px-3 sm:px-4 h-12 border-b border-white/[0.06]">
        <Link
          href="/dashboard/agents"
          className="font-mono text-[11px] uppercase tracking-wider text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          Agents
        </Link>
        <ChevronRight className="h-2.5 w-2.5 text-foreground/25 shrink-0" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-foreground/85 truncate">{agentName}</span>
        <button
          onClick={onNewChat}
          title="New chat"
          className="tap-target ml-auto h-9 px-3 flex items-center gap-1.5 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-150 font-mono text-[10px] uppercase tracking-widest font-black"
        >
          <SquarePen strokeWidth={2} className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* Conversations grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 sm:py-5">
        {conversations.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-3">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/20" strokeWidth={1.25} />
              <div>
                <p className="text-base sm:text-lg text-muted-foreground/70 font-medium">No chats yet.</p>
                <p className="text-xs sm:text-sm text-muted-foreground/50 mt-1">
                  Start a new chat to begin.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {conversations.map((conv, i) => {
              const isEditing = editingId === conv.id;
              const lastTime = conv.last_message_at ?? conv.updated_at ?? conv.created_at;
              const lastRole = conv.last_message_role;
              const preview = conv.last_message?.trim().replace(/\s+/g, " ") ?? "No messages yet.";
              const previewClipped = preview.length > 140 ? preview.slice(0, 140) + "…" : preview;

              return (
                <div
                  key={conv.id}
                  style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-md p-4 sm:p-4 min-h-[148px]",
                    "transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out",
                    "anim-fade-up press cursor-pointer",
                    isEditing
                      ? "glass-2 border-primary/40 shadow-[0_0_20px_-8px_rgba(200,241,53,0.4)]"
                      : "glass-2 hover:border-primary/30 hover:shadow-[0_0_24px_-12px_rgba(200,241,53,0.35)]"
                  )}
                  onClick={(e) => {
                    if (isEditing) return;
                    if ((e.target as HTMLElement).closest("[data-no-open]")) return;
                    onSelectChat(conv.id);
                  }}
                >
                  {/* Top row — title + edit affordance */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-white/[0.04] border border-white/[0.06] group-hover:bg-primary/10 group-hover:border-primary/25 transition-colors duration-200 mt-px">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveTitle(conv.id)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") handleSaveTitle(conv.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          disabled={isSaving}
                          data-no-open
                          className="w-full bg-transparent border border-primary/40 rounded-sm px-2 py-1 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/30"
                          placeholder="Conversation name"
                        />
                      ) : (
                        <p className="text-sm sm:text-[15px] font-medium text-foreground line-clamp-2 leading-snug">
                          {conv.title}
                        </p>
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(conv);
                        }}
                        data-no-open
                        className="tap-target h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white/[0.06] rounded-sm shrink-0"
                        title="Rename conversation"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Last message preview — anchors the card */}
                  <div className="flex items-start gap-2 pl-[38px] -mt-1">
                    {lastRole === "assistant" ? (
                      <Sparkles className="h-3 w-3 mt-1 shrink-0 text-primary/55" strokeWidth={1.75} />
                    ) : lastRole === "user" ? (
                      <User className="h-3 w-3 mt-1 shrink-0 text-muted-foreground/45" strokeWidth={1.75} />
                    ) : null}
                    <p className={cn(
                      "text-xs leading-relaxed line-clamp-2 font-light",
                      conv.last_message ? "text-muted-foreground/75" : "text-muted-foreground/40 italic",
                    )}>
                      {previewClipped}
                    </p>
                  </div>

                  {/* Footer — meta */}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/55 tabular-nums">
                      {formatDistanceToNow(new Date(lastTime))}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/55 tabular-nums">
                      <span className={conv.message_count > 0 ? "text-primary/70 font-bold" : "text-muted-foreground/45"}>
                        {conv.message_count}
                      </span>
                      <span className="text-muted-foreground/35">msg{conv.message_count === 1 ? "" : "s"}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
