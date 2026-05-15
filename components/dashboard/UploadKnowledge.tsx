"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { uploadDocument } from "@/lib/actions/document-actions";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; documentId: string; chunkCount: number }
  | { status: "error"; message: string };

const ACCEPTED_TYPES  = ["application/pdf", "text/plain", "text/markdown"];
const MAX_SIZE_BYTES  = 50 * 1024 * 1024; // 50 MB

export function UploadKnowledge({ agentId }: { agentId: string }) {
  const [file,        setFile]        = useState<File | null>(null);
  const [dragActive,  setDragActive]  = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((candidate: File | null | undefined) => {
    if (!candidate) return;

    const isAcceptedType = ACCEPTED_TYPES.includes(candidate.type) ||
      candidate.name.endsWith('.md');

    if (!isAcceptedType) {
      setUploadState({ status: "error", message: `"${candidate.name}" is not supported. Use PDF, TXT, or MD.` });
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setUploadState({ status: "error", message: `"${candidate.name}" exceeds 50 MB.` });
      return;
    }
    setFile(candidate);
    setUploadState({ status: "idle" });
  }, []);

  const handleDrop        = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragActive(false); validateAndSet(e.dataTransfer.files?.[0]);
  }, [validateAndSet]);
  const handleDragOver    = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragActive(true); }, []);
  const handleDragLeave   = useCallback(() => setDragActive(false), []);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSet(e.target.files?.[0]); e.target.value = "";
  }, [validateAndSet]);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploadState({ status: "uploading" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("agentId", agentId);
      const result = await uploadDocument(fd);
      if (result.success) {
        setUploadState({ status: "success", documentId: result.documentId, chunkCount: result.chunkCount });
        setFile(null);
      } else {
        setUploadState({ status: "error", message: result.error });
      }
    } catch {
      setUploadState({ status: "error", message: "Upload failed — please try again." });
    }
  }, [file, agentId]);

  const handleReset = useCallback(() => { setFile(null); setUploadState({ status: "idle" }); }, []);

  const isUploading = uploadState.status === "uploading";

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="File drop zone"
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isUploading && inputRef.current?.click()}
        onDrop={!isUploading ? handleDrop : undefined}
        onDragOver={!isUploading ? handleDragOver : undefined}
        onDragLeave={!isUploading ? handleDragLeave : undefined}
        className={cn(
          "flex items-center justify-center gap-3 rounded-sm",
          "border border-dashed px-4 py-5 text-center",
          "cursor-pointer select-none outline-none transition-colors",
          "focus-visible:border-ring/50",
          dragActive
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-border/70 hover:bg-muted/10",
          isUploading && "pointer-events-none opacity-50",
        )}
      >
        <Upload className="h-4 w-4 text-muted-foreground/30 shrink-0" strokeWidth={1.5} />
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-foreground/70">
            Drop PDF, TXT, or MD
          </span>
          <button
            type="button"
            tabIndex={-1}
            className="rounded-sm border border-border px-3 py-1 font-mono text-xs text-muted-foreground/70 hover:border-border/70 hover:text-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); if (!isUploading) inputRef.current?.click(); }}
          >
            browse
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        className="hidden"
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {/* Selected file */}
      {file && (
        <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/20 px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          <div className="flex-1 min-w-0">
            <p className="truncate font-mono text-xs text-foreground">{file.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground/40">{formatBytes(file.size)}</p>
          </div>
          {!isUploading && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              aria-label="Remove file"
              className="shrink-0 text-muted-foreground/30 transition-colors hover:text-foreground"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); void handleUpload(); }}
            disabled={isUploading}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isUploading && <Loader2 className="h-3 w-3 animate-spin" />}
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      )}

      {/* Success */}
      {uploadState.status === "success" && (
        <div className="flex items-start gap-2.5 rounded-sm border border-primary/20 bg-primary/5 px-4 py-3">
          <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm text-foreground">Upload complete</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {uploadState.chunkCount} chunk{uploadState.chunkCount !== 1 ? "s" : ""} indexed.
            </p>
          </div>
          <button onClick={handleReset} className="ml-auto text-[10px] font-mono text-muted-foreground/40 hover:text-foreground transition-colors">
            Upload another
          </button>
        </div>
      )}

      {/* Error */}
      {uploadState.status === "error" && (
        <div className="flex items-start gap-2.5 rounded-sm border border-destructive/20 bg-destructive/5 px-4 py-3">
          <XCircle className="mt-px h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{uploadState.message}</p>
        </div>
      )}
    </div>
  );
}
