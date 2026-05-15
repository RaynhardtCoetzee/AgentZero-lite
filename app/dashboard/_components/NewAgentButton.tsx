"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewAgentForm } from "@/components/dashboard/NewAgentForm";
import { Button } from "@/components/ui/button";

export function NewAgentButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-md font-sans font-semibold text-sm gap-2 px-4 h-9 shrink-0"
        aria-label="Create new agent"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">New Agent</span>
      </Button>

      {open && <NewAgentDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function NewAgentDrawer({ onClose }: { onClose: () => void }) {
  // Portal to document.body so the drawer escapes any parent stacking
  // context, transform, or filter set by the dashboard shell (the ambient
  // gradient layers were painting on top of the in-flow modal).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create new agent"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          zIndex: 9999,
          backgroundColor: "#030303",
          isolation: "isolate",
          boxShadow: "-30px 0 60px -20px rgba(0,0,0,0.8)",
        }}
        className={cn(
          "flex flex-col w-full md:w-[640px] xl:w-[720px]",
          "border-l border-border",
          "translate-x-0 starting:translate-x-full transition-transform duration-300 ease-out",
        )}
      >
        <div
          style={{ backgroundColor: "#050505" }}
          className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 h-12 border-b border-border"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
              New Agent
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm -mr-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 safe-pb">
          <NewAgentForm />
        </div>
      </div>
    </>,
    document.body,
  );
}
