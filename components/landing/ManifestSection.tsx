'use client'

import { useState } from 'react'

const NODES: Record<string, { path: string; title: string; body: string; tags: string[] }> = {
  app:       { path: '/app',               title: 'App Root',            body: 'Next.js 16 App Router. All routes, layouts, and server components live here. Structured for clarity — not cleverness. Every file is where you expect it.',                                                                              tags: ['Next.js 16', 'App Router', 'Server Components', 'TypeScript'] },
  dashboard: { path: '/app/dashboard',     title: 'Dashboard',           body: 'The authenticated shell. Agents, billing, knowledge base, usage, and settings — each a self-contained route with its own layout. PPR-ready: the shell renders in <100ms, dynamic feeds load behind Suspense boundaries.',              tags: ['App Router', 'PPR', 'Suspense', 'Auth.js v5'] },
  api:       { path: '/app/api',           title: 'API Routes',          body: 'Server-side route handlers for webhooks and external integrations. Lemon Squeezy billing events land here. Credit guard runs before any inference — if the balance is zero, the request never reaches the model.',                    tags: ['Route Handlers', 'Webhooks', 'Lemon Squeezy', 'Credit Guard'] },
  lib:       { path: '/lib',              title: 'Shared Library',      body: 'Utility functions, type definitions, and shared logic. Supabase client initialisation, auth helpers, billing utilities, and Zod schemas for all agent I/O. The shared contract everything else builds on.',                            tags: ['TypeScript', 'Zod', 'Supabase Client', 'Auth.js'] },
  ai:        { path: '/lib/ai',           title: 'RAG Pipeline',        body: 'Vector embedding pipeline built on AI SDK 6 with pgvector in Supabase. Chunk → embed → store → retrieve. Fully typed. Drop in your documents and the agent has long-term memory from day one. Streaming retrieval, no boilerplate.',  tags: ['AI SDK 6', 'pgvector', 'Supabase', 'Streaming'] },
  credits:   { path: '/lib/credits',      title: 'Credit Guard System', body: 'Middleware-level credit enforcement. Pre-run balance check, atomic deduction, usage log write — all in a single transaction. Runs block at zero. No race conditions, no partial charges, no surprises.',                              tags: ['Supabase', 'Transactions', 'Usage Logging', 'Server Actions'] },
  supabase:  { path: '/supabase',         title: 'Database & Multi-tenancy', body: "Row-level security policies, migration files, and typed schema via codegen. Every table has organisation-scoped RLS. Tenants cannot see each other's data — enforced at the database level, not the application layer.",          tags: ['Supabase', 'RLS', 'pgvector', 'Migrations'] },
}

const TREE: Array<{ id: string; label: string; prefix: string; isDir?: boolean; desc?: string }> = [
  { id: 'app',       label: 'app',       prefix: '/',        isDir: true },
  { id: 'dashboard', label: 'dashboard', prefix: '── /',     isDir: true, desc: 'agents · billing · settings' },
  { id: 'api',       label: 'api',       prefix: '── /' },
  { id: 'lib',       label: 'lib',       prefix: '── /',     isDir: true },
  { id: 'ai',        label: 'ai',        prefix: '│  ── /',  desc: 'RAG · AI SDK 6' },
  { id: 'credits',   label: 'credits',   prefix: '│  ── /',  desc: 'credit guard · billing' },
  { id: 'supabase',  label: 'supabase',  prefix: '── /',     desc: 'database · multi-tenancy' },
]

export function ManifestSection() {
  const [selected, setSelected] = useState('ai')
  const detail = NODES[selected]

  return (
    <section className="py-[100px] px-10 bg-[#0b0b0b]" id="manifest">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-[#4a4a4a] tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-[#c8f135]"/>
          architecture
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-white mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          Every directory earns its place.
        </h2>
        <p className="text-[15px] font-light text-[#888888] leading-[1.7] max-w-[520px]">
          The codebase is structured the way a senior engineer would build it. Not a tutorial project — a production scaffold you fork and ship.
        </p>

        <div className="mt-[52px] border border-[rgba(255,255,255,0.07)] rounded-[10px] overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] bg-[rgba(255,255,255,0.07)] gap-px">
          {/* Tree */}
          <div className="bg-[#111111] p-7 font-mono text-[13px] md:col-span-1">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#4a4a4a] tracking-[0.1em] uppercase pb-3.5 mb-2.5 border-b border-[rgba(255,255,255,0.07)]">
              <span className="w-3 h-3 border border-[rgba(255,255,255,0.11)] rounded-[3px] bg-[#161616]"/>
              project structure
            </div>
            {TREE.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={`flex items-center py-[5px] px-2 rounded cursor-pointer transition-colors gap-0 ${
                  selected === item.id
                    ? 'bg-[rgba(200,241,53,0.08)] border border-[rgba(200,241,53,0.28)]'
                    : 'hover:bg-[#161616] border border-transparent'
                }`}
              >
                <span className="text-[#2e2e2e] whitespace-pre text-[12px]">{item.prefix}</span>
                <span className={`font-medium ${item.isDir ? 'text-[#a8cc25]' : selected === item.id ? 'text-[#c8f135]' : 'text-[#e8e8e8]'}`}>
                  {item.label}
                </span>
                {item.desc && (
                  <>
                    <span className="text-[#2e2e2e] mx-2 text-[11px]">—</span>
                    <span className="text-[#4a4a4a] text-[11px]">{item.desc}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="bg-[#111111] p-7 flex flex-col md:col-span-2">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#4a4a4a] tracking-[0.1em] uppercase pb-3.5 mb-[18px] border-b border-[rgba(255,255,255,0.07)]">
              <span className="w-3 h-3 border border-[rgba(255,255,255,0.11)] rounded-[3px] bg-[#161616]"/>
              module detail
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#c8f135] mb-2.5">
              <span className="text-[#4a4a4a]">→</span>
              {detail.path}
            </div>
            <div className="font-mono text-[18px] font-semibold text-white mb-3 tracking-[-0.025em] leading-[1.2]">
              {detail.title}
            </div>
            <p className="text-[13px] text-[#888888] leading-[1.75] flex-1 mb-5 font-light">
              {detail.body}
            </p>
            <div className="flex flex-wrap gap-[5px] mt-auto">
              {detail.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] text-[#4a4a4a] bg-[#161616] border border-[rgba(255,255,255,0.11)] px-[9px] py-[3px] rounded-[3px] tracking-[0.03em] hover:border-[rgba(200,241,53,0.28)] hover:text-[#a8cc25] transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
