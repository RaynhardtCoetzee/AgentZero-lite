'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content space-y-3 text-sm text-foreground/80', className)}>
      <ReactMarkdown
        components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-black text-foreground mt-8 mb-4 leading-tight pb-3 border-b border-primary/25 pl-4 border-l-[4px] border-l-primary">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-foreground mt-7 mb-3 leading-tight pl-3 border-l-[3px] border-primary/55">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-primary/85 mt-5 mb-2 leading-tight uppercase tracking-[0.08em]">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xs font-semibold text-foreground/60 mt-4 mb-1.5 uppercase tracking-[0.16em]">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="leading-7 text-foreground/75 text-[13px]">{children}</p>
        ),
        code: ({ children }) => (
          <code className="bg-primary/8 px-1.5 py-0.5 rounded font-mono text-[11px] text-primary border border-primary/20">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-black/50 border border-white/[0.08] rounded-md p-4 overflow-x-auto my-4 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-t-md" />
            <code className="font-mono text-xs text-foreground/75 leading-relaxed">{children}</code>
          </pre>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1.5 my-3 ml-1 list-none">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside space-y-1.5 my-3 ml-5">{children}</ol>
        ),
        li: ({ children, ...props }) => {
          const isOrdered = (props as any).ordered;
          return (
            <li className="text-foreground/75 text-[13px] leading-6 flex items-start gap-2.5">
              {!isOrdered && (
                <span className="shrink-0 mt-[9px] w-1.5 h-1.5 rounded-full bg-primary/50" />
              )}
              <span>{children}</span>
            </li>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-primary/50 bg-primary/[0.04] pl-4 pr-3 py-2.5 my-4 rounded-r-md">
            <div className="text-foreground/65 text-[13px] leading-7 italic">{children}</div>
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary font-medium underline underline-offset-3 decoration-primary/40 hover:decoration-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/70">{children}</em>
        ),
        hr: () => (
          <div className="my-7 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <div className="w-1 h-1 rounded-full bg-primary/30" />
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-md border border-white/[0.08]">
            <table className="border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-white/[0.08] px-4 py-2.5 bg-white/[0.04] text-left font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-white/[0.04] px-4 py-2.5 text-[13px] text-foreground/70 last:border-0">{children}</td>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
