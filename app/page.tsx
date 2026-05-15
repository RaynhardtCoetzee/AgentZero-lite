import { LandingNav }      from '@/components/landing/LandingNav'
import { HeroSection }     from '@/components/landing/HeroSection'
import { ManifestSection } from '@/components/landing/ManifestSection'
import { WaitlistForm }    from '@/components/landing/WaitlistForm'

/* ── Marquee ────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Next.js 16','AI SDK 6','Supabase','Auth.js v5','pgvector',
  'Lemon Squeezy','TypeScript','Zod','Vercel','ReAct Loop','RAG Pipeline','Multi-tenant',
]

function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="w-full overflow-hidden border-t border-b border-white/[7%] bg-secondary py-[11px] whitespace-nowrap">
      <div className="inline-flex" style={{ animation: 'marquee 28s linear infinite' }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground tracking-[0.06em] uppercase px-8 border-r border-white/[7%]"
          >
            <span className="text-primary">{item}</span>
            <span className="w-1 h-1 rounded-full bg-white/[18%]"/>
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
    <div className="grid grid-cols-2 md:grid-cols-4 bg-secondary border-t border-b border-white/[7%]">
      {STATS.map(({ n, suffix, label }, i) => (
        <div
          key={i}
          className="px-4 sm:px-6 md:px-10 py-6 sm:py-8 border-r border-white/[7%] last:border-r-0 relative overflow-hidden group"
        >
          <div className="font-mono text-[42px] font-[200] tracking-[-0.05em] leading-none mb-2 text-foreground">
            <em className="not-italic text-primary">{n}</em>{suffix}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground tracking-[0.05em] leading-[1.5] uppercase whitespace-pre-line">
            {label}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 origin-left transition-transform duration-[400ms] group-hover:scale-x-100"/>
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
    title: 'Billing Infrastructure',
    body: 'Lemon Squeezy handles billing as Merchant of Record — VAT compliance across 50+ countries handled for you. Credit top-ups, payment history, invoice download, webhook handling, all wired.',
    tech: 'Lemon Squeezy · Webhooks · Supabase ledger',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
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
    <section className="py-[60px] sm:py-[100px] px-4 sm:px-10 bg-secondary border-t border-b border-white/[7%]" id="stack">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-muted-foreground tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-primary"/>
          stack
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-foreground mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          Six domains. Pre-assembled.
        </h2>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-foreground mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          Six domains. Pre-assembled.
        </h2>
        <p className="text-[15px] font-light text-muted-foreground leading-[1.7] max-w-[520px]">
          Auth, multi-tenancy, agent orchestration, vector memory, credit guards, billing — integrated and tested, not bolted together the night before launch.
        </p>

        <div className="mt-[52px] grid grid-cols-1 md:grid-cols-3 bg-white/[7%] border border-white/[7%] rounded-[10px] overflow-hidden gap-px">
          {STACK_CARDS.map(({ title, body, tech, icon }) => (
            <div
              key={title}
              className="bg-secondary p-[30px] transition-colors hover:bg-card relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent transition-colors group-hover:bg-primary"/>
              <div className="w-9 h-9 border border-white/[11%] rounded-lg bg-muted/50 flex items-center justify-center text-primary mb-[18px] transition-[border-color,background] group-hover:border-primary/[28%] group-hover:bg-primary/[8%]">
                {icon}
              </div>
              <div className="font-mono text-[13px] font-semibold text-foreground mb-2 tracking-[-0.01em]">{title}</div>
              <p className="text-[13px] text-muted-foreground leading-[1.65] font-light mb-3.5">{body}</p>
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.04em] border-t border-white/[7%] pt-3">
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
  { time: '2 AM',  loc: 'Pretoria', text: <>bartending funds the build. just pushed <em className="not-italic font-mono text-[12px] text-foreground">auth.js v5 multi-tenant config</em>. running clean on Vercel.</> },
  { time: '9 PM',  loc: '—',        text: <>RAG pipeline is streaming via vector chunks. <em className="not-italic font-mono text-[12px] text-foreground">it works.</em></> },
  { time: '11 PM', loc: 'Pretoria', text: <><em className="not-italic font-mono text-[12px] text-foreground">credit guard</em> deployed. pre-run balance check + per-run deduction in a single DB transaction. no race conditions.</> },
  { time: '3 AM',  loc: '—',        text: <>lemon squeezy webhooks wired. top-up flow end-to-end working. bought a coffee with the first test payment.</> },
  { time: '6 PM',  loc: 'Pretoria', text: <>deployed to <em className="not-italic font-mono text-[12px] text-foreground">Vercel</em>. cold start under 200ms. <em className="not-italic font-mono text-[12px] text-foreground">shipping this.</em></> },
]

function LogSection() {
  return (
    <section className="py-[60px] sm:py-[100px] px-4 sm:px-10 bg-background" id="log">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-muted-foreground tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-primary"/>
          founder&apos;s log
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-foreground mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          Built in public.<br/>In South Africa.<br/>Funded by bartending.
        </h2>
        <p className="text-[15px] font-light text-muted-foreground leading-[1.7] max-w-[520px]">
          No VC round. No team. One developer, shipping until it&apos;s production-ready. Every line written between shifts.
        </p>

        {/* Desktop table */}
        <table className="hidden md:table mt-[52px] w-full border-collapse font-mono">
          <thead>
            <tr className="border-b border-white/[11%]">
              <th className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase pb-3 text-left font-normal w-[100px]">time</th>
              <th className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase pb-3 text-left font-normal w-[120px]">location</th>
              <th className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase pb-3 text-left font-normal">entry</th>
            </tr>
          </thead>
          <tbody>
            {LOG_ENTRIES.map(({ time, loc, text }, i) => (
              <tr key={i} className="border-b border-white/[4%] hover:bg-secondary transition-colors">
                <td className="py-[18px] text-muted-foreground text-[12px] align-top">{time}</td>
                <td className="py-[18px] text-primary text-[12px] align-top">{loc}</td>
                <td className="py-[18px] text-muted-foreground text-[13px] leading-[1.6] align-top font-sans font-light">{text}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="md:hidden mt-[52px] space-y-4 font-mono">
          {LOG_ENTRIES.map(({ time, loc, text }, i) => (
            <div key={i} className="border border-white/[4%] hover:bg-secondary transition-colors p-4 rounded-md">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-[12px] text-muted-foreground flex-shrink-0 w-12">{time}</span>
                <span className="text-[12px] text-primary flex-shrink-0">{loc}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.6] font-sans font-light">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ────────────────────────────────────────────── */
const FOUNDING_FEATURES = [
  'Complete Next.js 16 + AI SDK 6 codebase',
  'Auth.js v5 multi-tenant architecture',
  'RAG pipeline with pgvector',
  'Lemon Squeezy billing + credit guard system',
  'Streaming ReAct agent loop',
  'Type-safe end-to-end with Zod',
  'Deploy to Vercel in one command',
  'Lifetime access to all future updates',
]

function PricingSection() {
  return (
    <section className="py-[60px] sm:py-[100px] px-4 sm:px-10 bg-secondary border-t border-white/[7%]" id="pricing">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-muted-foreground tracking-[0.12em] uppercase mb-3.5">
          <span className="w-5 h-px bg-primary"/>
          pricing
        </div>
        <h2 className="font-mono font-semibold tracking-[-0.035em] leading-[1.08] text-foreground mb-4" style={{ fontSize: 'clamp(26px, 2.8vw, 40px)' }}>
          One price. You own it.
        </h2>
        <p className="text-[15px] font-light text-muted-foreground leading-[1.7] max-w-[520px]">
          No subscription. No seat fees. No lock-in. Buy once, fork it, deploy it, charge your users whatever you like.
        </p>

        <div className="mt-[52px] grid grid-cols-1 md:grid-cols-2 bg-white/[7%] border border-white/[7%] rounded-[10px] overflow-hidden gap-px max-w-[860px]">
          {/* Founding member card */}
          <div className="bg-card p-10 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary"/>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-primary bg-primary/8 border border-primary/28 px-[10px] py-1 rounded-[3px] mb-6 w-fit tracking-[0.06em] uppercase">
              <span className="w-1 h-1 rounded-full bg-primary"/>
              founding member — limited
            </div>
            <div className="font-mono text-[58px] font-[200] tracking-[-0.05em] leading-none mb-1.5 text-primary">
              <span className="text-[24px] align-super text-primary">$</span>129
            </div>
            <div className="font-mono text-[12px] text-muted-foreground line-through mb-5">$249 after founding window closes</div>
            <p className="text-[13px] text-muted-foreground leading-[1.7] font-light mb-7">
              Everything in the standard licence. Same code, same architecture. Founding price closes when the window ends — no fake timer, no scarcity theatre.
            </p>
            <ul className="flex flex-col gap-[9px] mb-8 flex-1">
              {FOUNDING_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 font-mono text-[12px] text-muted-foreground leading-[1.5]">
                  <span className="text-primary flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <WaitlistForm />
          </div>

          {/* Standard card */}
          <div className="bg-secondary p-10 flex flex-col">
            <div className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] uppercase mb-6">standard licence</div>
            <div className="font-mono text-[58px] font-[200] tracking-[-0.05em] leading-none mb-1.5 mt-6 text-foreground">
              <span className="text-[24px] align-super text-muted-foreground">$</span>249
            </div>
            <p className="text-[13px] text-muted-foreground leading-[1.7] font-light mt-4 mb-7">
              Same codebase. Standard price after the founding window closes. Still a one-time purchase. Still yours forever.
            </p>
            <ul className="flex flex-col gap-[9px] mb-8 flex-1">
              {['Everything in founding licence', 'No founding discount', 'No early-access update priority'].map((f, i) => (
                <li key={f} className={`flex items-start gap-2.5 font-mono text-[12px] leading-[1.5] ${i === 0 ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  <span className={i === 0 ? 'text-primary' : 'text-muted-foreground'}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="block w-full text-center bg-transparent text-muted-foreground font-mono text-[13px] py-3 rounded-[6px] border border-white/[11%] hover:text-foreground hover:border-white/[18%] transition-[color,border-color] mt-auto"
            >
              Join waitlist for standard
            </a>
          </div>
        </div>

        <p className="mt-[22px] font-mono text-[11px] text-muted-foreground leading-[1.9]">
          Questions?{' '}
          <a href="mailto:hello@agentzero.dev" className="text-primary hover:underline">hello@agentzero.dev</a>
          {' '}·{' '}Built in SA. Funded by bartending. Owned by you.
        </p>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────── */
function SiteFooter() {
  return (
    <footer className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 px-4 sm:px-10 py-6 md:py-9 border-t border-white/[7%]">
      <a href="#" className="font-mono text-[14px] font-semibold text-muted-foreground tracking-[-0.02em] no-underline">
        AgentZero<span className="text-primary">.</span>
      </a>
      <span className="font-mono text-[11px] text-muted-foreground">© 2026 · one-time licence · built in Pretoria</span>
      <div className="flex flex-wrap gap-4 md:gap-6 md:ml-auto">
        {['Docs', 'GitHub', 'X / Twitter'].map((l) => (
          <a key={l} href="#" className="font-mono text-[11px] text-muted-foreground no-underline hover:text-foreground transition-colors tracking-[0.02em]">{l}</a>
        ))}
      </div>
      <span className="text-primary text-[16px] opacity-50 hidden md:inline">✦</span>
    </footer>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
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