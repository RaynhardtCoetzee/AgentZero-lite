import { LandingNav }      from '@/components/landing/LandingNav'
import { HeroSection }     from '@/components/landing/HeroSection'
import { ManifestSection } from '@/components/landing/ManifestSection'
import { WaitlistForm }    from '@/components/landing/WaitlistForm'

/* ── Marquee ────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Next.js 16','AI SDK 6','Supabase','Auth.js v5','pgvector',
  'TypeScript','Zod','Vercel','ReAct Loop','RAG Pipeline','Multi-tenant',
]

function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="w-full overflow-hidden border-t border-b border-[rgba(255,255,255,0.07)] bg-[#111111] py-[11px] whitespace-nowrap">
      <div className="inline-flex" style={{ animation: 'marquee 28s linear infinite' }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2.5 font-mono text-[11px] text-[#4a4a4a] tracking-[0.06em] uppercase px-8 border-r border-[rgba(255,255,255,0.07)]"
          >
            <span className="text-[#c8f135]">{item}</span>
            <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.18)]"/>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Stats band ─────────────────────────────────────────── */
const STATS = [
  { n: '40', suffix: '–80', label: 'hours saved\nvs scratch' },
  { n: '6',  suffix: '',    label: 'production domains\npre-assembled' },
  { n: '1',  suffix: '',    label: 'day to a deployed\nbillable product' },
  { n: '$',  suffix: '129', label: 'founding member\none-time licence' },
]

function StatsBand() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 bg-[#111111] border-t border-b border-[rgba(255,255,255,0.07)]">
      {STATS.map(({ n, suffix, label }, i) => (
        <div
          key={i}
          className="px-10 py-8 border-r border-[rgba(255,255,255,0.07)] last:border-r-0 relative overflow-hidden group"
        >
          <div className="font-mono text-[42px] font-[200] tracking-[-0.05em] leading-none mb-2 text-[#e8e8e8]">
            <em className="not-italic text-[#c8f135]">{n}</em>{suffix}
          </div>
          <div className="font-mono text-[11px] text-[#4a4a4a] tracking-[0.05em] leading-[1.5] uppercase whitespace-pre-line">
            {label}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c8f135] scale-x-0 origin-left transition-transform duration-[400ms] group-hover:scale-x-100"/>
        </div>
      ))}
    </div>
  )
}

/* ── Stack section ──────────────────────────────────────── */
const STACK_CARDS = [
  {
    title: 'Auth + Multi-tenancy',
    body: 'Auth.js v5 with full organisation-level isolation. Every user, every agent run, every data row scoped to a tenant from day one. RLS everywhere.',
    tech: 'Auth.js v5 · Supabase RLS · Next.js middleware',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  },
  {
    title: 'Agent Orchestration',
    body: 'ReAct loop with streaming tool calls. Configurable per-agent: model, tools, system prompt, knowledge base. Visible reasoning chain in the UI.',
    tech: 'AI SDK 6 · Next.js 16 · Server Actions',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  },
  {
    title: 'Vector Memory (RAG)',
    body: 'PDF and TXT ingestion, automatic chunking, pgvector embeddings, semantic retrieval. Agents read your documents before every run without extra config.',
    tech: 'pgvector · Supabase · AI SDK embeddings',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z"/><circle cx="18" cy="18" r="3"/></svg>,
  },
  {
    title: 'Credit Guard System',
    body: 'Pre-run balance checks, per-run deduction, usage logging per agent. Runs block automatically at zero in a single atomic transaction. No race conditions.',
    tech: 'Supabase DB · Server-side guard · Atomic txn',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    title: 'Type-safe Codebase',
    body: 'End-to-end TypeScript. Zod validation on all agent I/O. Database schemas fully typed via Supabase codegen. Refactor with confidence from day one.',
    tech: 'TypeScript · Zod · Supabase codegen',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
]

function StackSection() {
  return (
    <section className="py-[100px] px-10 bg-[#111111] border-t border-b border-[rgba(255,255,255,0.07)]" id="stack">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-[#4a4a4a] tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-[#c8f135]"/>
          stack
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-white mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          Six domains. Pre-assembled.
        </h2>
        <p className="text-[15px] font-light text-[#888888] leading-[1.7] max-w-[520px]">
          Auth, multi-tenancy, agent orchestration, vector memory, and credit guards — integrated and tested, not bolted together the night before launch.
        </p>

        <div className="mt-[52px] grid grid-cols-1 md:grid-cols-3 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.07)] rounded-[10px] overflow-hidden gap-px">
          {STACK_CARDS.map(({ title, body, tech, icon }) => (
            <div
              key={title}
              className="bg-[#111111] p-[30px] transition-colors hover:bg-[#161616] relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent transition-colors group-hover:bg-[#c8f135]"/>
              <div className="w-9 h-9 border border-[rgba(255,255,255,0.11)] rounded-lg bg-[#1d1d1d] flex items-center justify-center text-[#c8f135] mb-[18px] transition-[border-color,background] group-hover:border-[rgba(200,241,53,0.28)] group-hover:bg-[rgba(200,241,53,0.08)]">
                {icon}
              </div>
              <div className="font-mono text-[13px] font-semibold text-white mb-2 tracking-[-0.01em]">{title}</div>
              <p className="text-[13px] text-[#888888] leading-[1.65] font-light mb-3.5">{body}</p>
              <div className="font-mono text-[10px] text-[#4a4a4a] tracking-[0.04em] border-t border-[rgba(255,255,255,0.07)] pt-3">
                {tech}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Founder's log ──────────────────────────────────────── */
const LOG_ENTRIES = [
  { time: '2 AM',  loc: 'Pretoria', text: <>bartending funds the build. just pushed <em className="not-italic font-mono text-[12px] text-[#e8e8e8]">auth.js v5 multi-tenant config</em>. running clean on Vercel.</> },
  { time: '9 PM',  loc: '—',        text: <>RAG pipeline is streaming via vector chunks. <em className="not-italic font-mono text-[12px] text-[#e8e8e8]">it works.</em></> },
  { time: '11 PM', loc: 'Pretoria', text: <><em className="not-italic font-mono text-[12px] text-[#e8e8e8]">credit guard</em> deployed. pre-run balance check + per-run deduction in a single DB transaction. no race conditions.</> },
  { time: '3 AM',  loc: '—',        text: <>usage tracking shipped end-to-end. telemetry, credit flow, and run logs now line up cleanly.</> },
  { time: '6 PM',  loc: 'Pretoria', text: <>deployed to <em className="not-italic font-mono text-[12px] text-[#e8e8e8]">Vercel</em>. cold start under 200ms. <em className="not-italic font-mono text-[12px] text-[#e8e8e8]">shipping this.</em></> },
]

function LogSection() {
  return (
    <section className="py-[100px] px-10 bg-[#0b0b0b]" id="log">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-[#4a4a4a] tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-[#c8f135]"/>
          founder&apos;s log
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-white mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          Built in public.<br/>In South Africa.<br/>Funded by bartending.
        </h2>
        <p className="text-[15px] font-light text-[#888888] leading-[1.7] max-w-[520px]">
          No VC round. No team. One developer, shipping until it&apos;s production-ready. Every line written between shifts.
        </p>

        <table className="mt-[52px] w-full border-collapse font-mono">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.11)]">
              <th className="text-[10px] text-[#4a4a4a] tracking-[0.1em] uppercase pb-3 text-left font-normal w-[100px]">time</th>
              <th className="text-[10px] text-[#4a4a4a] tracking-[0.1em] uppercase pb-3 text-left font-normal w-[120px]">location</th>
              <th className="text-[10px] text-[#4a4a4a] tracking-[0.1em] uppercase pb-3 text-left font-normal">entry</th>
            </tr>
          </thead>
          <tbody>
            {LOG_ENTRIES.map(({ time, loc, text }, i) => (
              <tr key={i} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[#111111] transition-colors">
                <td className="py-[18px] text-[#4a4a4a] text-[12px] align-top">{time}</td>
                <td className="py-[18px] text-[#a8cc25] text-[12px] align-top">{loc}</td>
                <td className="py-[18px] text-[#888888] text-[13px] leading-[1.6] align-top font-sans font-light">{text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ── Pricing ────────────────────────────────────────────── */
const FOUNDING_FEATURES = [
  'Complete Next.js 16 + AI SDK 6 codebase',
  'Auth.js v5 multi-tenant architecture',
  'RAG pipeline with pgvector',
  'Credit guard system with usage tracking',
  'Streaming ReAct agent loop',
  'Type-safe end-to-end with Zod',
  'Deploy to Vercel in one command',
  'Lifetime access to all future updates',
]

function PricingSection() {
  return (
    <section className="py-[100px] px-10 bg-[#111111] border-t border-[rgba(255,255,255,0.07)]" id="pricing">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-[#4a4a4a] tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-[#c8f135]"/>
          pricing
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-white mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          One price. You own it.
        </h2>
        <p className="text-[15px] font-light text-[#888888] leading-[1.7] max-w-[520px]">
          No subscription. No seat fees. No lock-in. Buy once, fork it, deploy it, charge your users whatever you like.
        </p>

        <div className="mt-[52px] grid grid-cols-1 md:grid-cols-2 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.07)] rounded-[10px] overflow-hidden gap-px max-w-[860px]">
          {/* Founding member card */}
          <div className="bg-[#161616] p-10 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#c8f135]"/>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#a8cc25] bg-[rgba(200,241,53,0.08)] border border-[rgba(200,241,53,0.28)] px-[10px] py-1 rounded-[3px] mb-6 w-fit tracking-[0.06em] uppercase">
              <span className="w-1 h-1 rounded-full bg-[#c8f135]"/>
              founding member — limited
            </div>
            <div className="font-mono text-[58px] font-[200] tracking-[-0.05em] leading-none mb-1.5 text-[#c8f135]">
              <span className="text-[24px] align-super text-[#a8cc25]">$</span>129
            </div>
            <div className="font-mono text-[12px] text-[#4a4a4a] line-through mb-5">$249 after founding window closes</div>
            <p className="text-[13px] text-[#888888] leading-[1.7] font-light mb-7">
              Everything in the standard licence. Same code, same architecture. Founding price closes when the window ends — no fake timer, no scarcity theatre.
            </p>
            <ul className="flex flex-col gap-[9px] mb-8 flex-1">
              {FOUNDING_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 font-mono text-[12px] text-[#888888] leading-[1.5]">
                  <span className="text-[#c8f135] flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <WaitlistForm />
          </div>

          {/* Standard card */}
          <div className="bg-[#111111] p-10 flex flex-col">
            <div className="font-mono text-[10px] text-[#4a4a4a] tracking-[0.1em] uppercase mb-6">standard licence</div>
            <div className="font-mono text-[58px] font-[200] tracking-[-0.05em] leading-none mb-1.5 mt-6 text-[#e8e8e8]">
              <span className="text-[24px] align-super text-[#4a4a4a]">$</span>249
            </div>
            <p className="text-[13px] text-[#888888] leading-[1.7] font-light mt-4 mb-7">
              Same codebase. Standard price after the founding window closes. Still a one-time purchase. Still yours forever.
            </p>
            <ul className="flex flex-col gap-[9px] mb-8 flex-1">
              {['Everything in founding licence', 'No founding discount', 'No early-access update priority'].map((f, i) => (
                <li key={f} className={`flex items-start gap-2.5 font-mono text-[12px] leading-[1.5] ${i === 0 ? 'text-[#888888]' : 'text-[#4a4a4a]'}`}>
                  <span className={i === 0 ? 'text-[#c8f135]' : 'text-[#4a4a4a]'}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="block w-full text-center bg-transparent text-[#888888] font-mono text-[13px] py-3 rounded-[6px] border border-[rgba(255,255,255,0.11)] hover:text-[#e8e8e8] hover:border-[rgba(255,255,255,0.18)] transition-[color,border-color] mt-auto"
            >
              Join waitlist for standard
            </a>
          </div>
        </div>

        <p className="mt-[22px] font-mono text-[11px] text-[#4a4a4a] leading-[1.9]">
          Questions?{' '}
          <a href="mailto:hello@agentzero.dev" className="text-[#a8cc25] hover:underline">hello@agentzero.dev</a>
          {' '}·{' '}Built in SA. Funded by bartending. Owned by you.
        </p>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────── */
function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-10 px-10 py-9 border-t border-[rgba(255,255,255,0.07)]">
      <a href="#" className="font-mono text-[14px] font-semibold text-[#4a4a4a] tracking-[-0.02em] no-underline">
        AgentZero<span className="text-[#c8f135]">.</span>
      </a>
      <span className="font-mono text-[11px] text-[#4a4a4a]">© 2026 · one-time licence · built in Pretoria</span>
      <div className="flex gap-6 ml-auto">
        {['Docs', 'GitHub', 'X / Twitter'].map((l) => (
          <a key={l} href="#" className="font-mono text-[11px] text-[#4a4a4a] no-underline hover:text-[#e8e8e8] transition-colors tracking-[0.02em]">{l}</a>
        ))}
      </div>
      <span className="text-[#c8f135] text-[16px] opacity-50">✦</span>
    </footer>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e8e8e8] overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <MarqueeStrip />
      <StatsBand />
      <ManifestSection />
      <StackSection />
      <LogSection />
      <PricingSection />
      <SiteFooter />
    </div>
  )
}
