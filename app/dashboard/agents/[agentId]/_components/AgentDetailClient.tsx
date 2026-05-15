"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AgentChat } from "@/components/dashboard/AgentChat";
import { AgentConfigPanel } from "@/components/dashboard/AgentConfigPanel";
import { ChatKanban } from "@/components/dashboard/ChatKanban";
import { ChevronLeft, SquarePen, Settings2, PanelRight, FileText, BookOpen, Zap } from "lucide-react";
import { listOrgDocuments } from "@/lib/actions/document-actions";
import { TOOL_REGISTRY } from "@/lib/ai/tool-registry";
import { cn } from "@/lib/utils";

// ─── ChatContextPanel ─────────────────────────────────────────────────────────

type DocFile = { id: string; file_name: string; file_type: string };

function ChatContextPanel() {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrgDocuments().then(res => {
      if (res.ok) setDocs(res.documents);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l border-border/25 bg-card/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/25 shrink-0">
        <Zap className="h-3 w-3 text-primary/50 shrink-0" />
        <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40 font-medium">Context</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Knowledge section */}
        <div className="p-3 border-b border-border/20">
          <div className="flex items-center gap-1.5 mb-2.5">
            <BookOpen className="h-3 w-3 text-muted-foreground/35 shrink-0" />
            <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/40 font-medium">Knowledge</p>
          </div>
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2].map(i => (
                <div key={i} className="h-6 rounded-sm bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="space-y-1">
              <p className="font-mono text-[8px] text-muted-foreground/35 leading-relaxed">No files indexed.</p>
              <Link
                href="/dashboard/knowledge"
                className="font-mono text-[8px] text-primary/55 hover:text-primary transition-colors duration-150 uppercase tracking-wide"
              >
                + Upload →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 rounded-sm px-2 py-1.5 bg-muted/15 border border-border/20 group">
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                  <span className="font-mono text-[8px] text-foreground/55 truncate flex-1 uppercase tracking-wide">{doc.file_name}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tools section */}
        <div className="p-3">
          <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-2.5 font-medium">Available Tools</p>
          <div className="space-y-1">
            {TOOL_REGISTRY.map(tool => (
              <div
                key={tool.id}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 border border-primary/12 bg-primary/[4%]"
              >
                <tool.icon strokeWidth={1.5} className="h-3 w-3 shrink-0 text-primary/50" />
                <span className="font-mono text-[8px] text-foreground/60 truncate uppercase tracking-wide">{tool.label}</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AgentDetailClient ────────────────────────────────────────────────────────

type AgentDetailClientProps = {
  agentId: string;
  agentName: string;
  initialPrompt?: string | null;
  defaultModelId: string;
};

export function AgentDetailClient({ agentId, agentName, initialPrompt = null, defaultModelId }: AgentDetailClientProps) {
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState(searchParams.get("view") === "chat");
  const [showConfig, setShowConfig] = useState(searchParams.get("view") === "config");
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const promptFromUrl = searchParams.get("prompt") ?? undefined;

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setIsNewChat(true);
    setShowConfig(false);
    setIsCompact(false);
  };

  const handleBackToKanban = () => {
    setSelectedConversationId(null);
    setIsNewChat(false);
    setShowConfig(false);
    setIsCompact(false);
  };

  const inChat = selectedConversationId !== null || isNewChat;

  // ── Fixed Top NavBar ──────────────────────────────────────────────────────────
 function NavBar({ right, compact }: { right?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn(
      "sticky top-0 z-30", // Pinned to the top of the container
      "bg-card/80 backdrop-blur-md", // Background blur for a premium look
      "flex items-center gap-4 shrink-0 px-4 sm:px-6 border-b border-border/25 overflow-hidden",
      "transition-[height,opacity] duration-200 ease-out",
      compact ? "h-9" : "h-12",
    )}>
        {/* Back */}
        <button
          onClick={handleBackToKanban}
          className="flex items-center gap-2.5 px-1 text-foreground/40 hover:text-foreground/70 transition-colors duration-200 rounded-sm hover:bg-muted/40 sm:hover:bg-transparent -ml-1"
          aria-label="Back to chats"
        >
          <ChevronLeft strokeWidth={1.5} className={cn(
            "shrink-0 transition-[width,height] duration-200",
            compact ? "h-4 w-4" : "h-5 w-5 sm:h-4 sm:w-4",
          )} />
          <span className={cn(
            "font-mono uppercase tracking-wider hidden sm:inline text-foreground/50 transition-[font-size] duration-200",
            compact ? "text-[8px]" : "text-[9px]",
          )}>{agentName}</span>
        </button>

        <div className="flex-1" />
        {right}
      </div>
    );
  }

  // ── Config view ─────────────────────────────────────────────────────────────
  if (showConfig) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <NavBar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <AgentConfigPanel
            agentId={agentId}
            initialName={agentName}
            initialPrompt={initialPrompt}
          />
        </div>
      </div>
    );
  }

  // ── Chat view ───────────────────────────────────────────────────────────────
 if (inChat) {
  return (
    /** 
     * OUTER CONTAINER 
     * We use h-full to fill the Dashboard shell. 
     * overflow-hidden is CRITICAL here so the window doesn't scroll; 
     * only the message list inside AgentChat should scroll.
     */
    <div className="flex flex-col h-full w-full overflow-hidden">
      <NavBar
        compact={isCompact}
        right={
          <div className="fixed right-0 top-0 z-[60] h-dvh items-center gap-1">
            <button
              onClick={() => setShowContextPanel(v => !v)}
              title="Agent context"
              className={`hidden lg:flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-sm transition-all duration-150 active:scale-90 ${
                showContextPanel
                  ? "text-primary bg-primary/10"
                  : "text-foreground/40 hover:text-foreground/70 hover:bg-muted/40"
              }`}
            >
              <PanelRight strokeWidth={1.5} className="h-4 w-4" />
            </button>
            <button
              onClick={handleNewChat}
              title="New chat"
              className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-sm text-foreground/40 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all duration-150"
            >
              <SquarePen strokeWidth={1.5} className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowConfig(true)}
              title="Agent settings"
              className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-sm text-foreground/40 hover:text-foreground hover:bg-muted/40 active:scale-90 transition-all duration-150"
            >
              <Settings2 strokeWidth={1.5} className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/** 
       * CONTENT WRAPPER 
       * flex-1 and min-h-0 are required to allow the internal 
       * scroll container to function correctly.
       */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AgentChat
            agentId={agentId}
            agentName={agentName}
            initialConversationId={selectedConversationId ?? undefined}
            selectedModel={defaultModelId}
            initialMessage={promptFromUrl}
            onCompact={setIsCompact}
          />
        </div>
        
        {showContextPanel && (
          <div className="hidden lg:flex w-52 shrink-0 flex-col overflow-hidden h-full border-l border-border/25">
            <ChatContextPanel />
          </div>
        )}
      </div>
    </div>
  );
}
  // ── Kanban view ─────────────────────────────────────────────────────────────
  return (
    <ChatKanban
      agentId={agentId}
      agentName={agentName}
      onSelectChat={(id) => { setSelectedConversationId(id); setIsNewChat(false); }}
      onNewChat={handleNewChat}
    />
  );
}