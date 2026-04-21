'use client'

import { useState, useRef } from 'react'

const PROOF_PILLS = [
  'TypeScript-first',
  'One-time licence',
  'You own the code',
  'Deploys on Vercel',
]

const TIP_DATA: Record<string, { title: string; body: string }> = {
  rag:    { title: 'RAG Pipeline',     body: 'Ingests PDF & TXT, chunks, embeds via AI SDK 6, stores in pgvector. Agents retrieve relevant context before every run.' },
  model:  { title: 'Model Inference',  body: 'Streaming ReAct loop via AI SDK 6. Swap models per-agent — Sonnet, Opus, Haiku. Tool calls surface in real time.' },
  credit: { title: 'Credit Guard',     body: 'Pre-run balance check + atomic per-run deduction in one DB transaction. Runs block at zero. No race conditions.' },
  eval:   { title: 'Eval Loop',        body: 'Structured output validation with Zod on every agent response. Failed evals retry before surfacing the error.' },
  core:   { title: 'Agent Controller', body: 'The orchestration layer. Routes prompts, enforces credits, streams tool call logs, and writes the final output to the run record.' },
}

function ArchDiagram() {
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function showTip(e: React.MouseEvent, id: string) {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    setTip({ id, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const activeTip = tip ? TIP_DATA[tip.id] : null

  return (
    <div ref={panelRef} className="relative flex-1 flex flex-col items-center justify-center px-10 py-20 z-10">
      <p className="font-mono text-[10px] text-[#4a4a4a] tracking-[0.12em] uppercase mb-8 self-start">
        architecture overview{' '}
        <span className="text-[#2e2e2e] text-[9px] tracking-[0.06em]">· hover to explore</span>
      </p>

      <svg viewBox="0 0 440 470" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[440px]">
        <defs>
          <filter id="f-glow-lg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="f-glow-md" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="f-glow-sm" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="f-shadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.6"/>
          </filter>

          <linearGradient id="g-cyl-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#2e2e2e"/>
            <stop offset="18%"  stopColor="#3a3a3a"/>
            <stop offset="45%"  stopColor="#252525"/>
            <stop offset="75%"  stopColor="#181818"/>
            <stop offset="100%" stopColor="#111111"/>
          </linearGradient>
          <radialGradient id="g-cyl-top" cx="35%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#484848"/>
            <stop offset="40%"  stopColor="#2e2e2e"/>
            <stop offset="100%" stopColor="#1a1a1a"/>
          </radialGradient>
          <radialGradient id="g-cyl-rim" cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#5a5a5a" stopOpacity="1"/>
            <stop offset="60%"  stopColor="#333"    stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="g-cyl-inner" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#c8f135" stopOpacity="0.06"/>
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0"/>
          </radialGradient>

          <linearGradient id="g-sat-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#282828"/>
            <stop offset="30%"  stopColor="#222222"/>
            <stop offset="100%" stopColor="#141414"/>
          </linearGradient>
          <radialGradient id="g-sat-top" cx="38%" cy="38%" r="62%">
            <stop offset="0%"   stopColor="#c8f135"/>
            <stop offset="55%"  stopColor="#a8cc25"/>
            <stop offset="100%" stopColor="#6a8010"/>
          </radialGradient>
          <radialGradient id="g-sat-top-shine" cx="28%" cy="25%" r="45%">
            <stop offset="0%"   stopColor="#e8ff70" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0"/>
          </radialGradient>

          <linearGradient id="g-conn-1" x1="182" y1="205" x2="278" y2="68"  gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c8f135" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0.15"/>
          </linearGradient>
          <linearGradient id="g-conn-2" x1="182" y1="205" x2="282" y2="152" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c8f135" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0.15"/>
          </linearGradient>
          <linearGradient id="g-conn-3" x1="182" y1="205" x2="282" y2="283" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c8f135" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0.15"/>
          </linearGradient>
          <linearGradient id="g-conn-4" x1="182" y1="205" x2="276" y2="363" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c8f135" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0.15"/>
          </linearGradient>

          <clipPath id="clip-cyl-body">
            <rect x="50" y="178" width="264" height="56"/>
          </clipPath>
        </defs>

        {/* Ambient glow behind central cylinder */}
        <ellipse cx="182" cy="206" rx="130" ry="50" fill="#c8f135" opacity="0.03" filter="url(#f-glow-lg)"/>

        {/* Connector: RAG PIPELINE */}
        <line x1="295" y1="67"  x2="182" y2="186" stroke="url(#g-conn-1)" strokeWidth="4" strokeLinecap="round" opacity="0.18"/>
        <line x1="295" y1="67"  x2="182" y2="186" stroke="url(#g-conn-1)" strokeWidth="1.5" strokeDasharray="6 5" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" values="0;-22" dur="1.5s" repeatCount="indefinite"/>
        </line>
        <circle cx="295" cy="67"  r="3.5" fill="#c8f135" opacity="0.6" filter="url(#f-glow-sm)"/>
        <circle cx="182" cy="186" r="3"   fill="#c8f135" opacity="0.35"/>
        <circle r="3.5" fill="#c8f135" opacity="0.9" filter="url(#f-glow-md)">
          <animateMotion dur="1.5s" repeatCount="indefinite" calcMode="linear" path="M295,67 L182,186"/>
        </circle>

        {/* Connector: MODEL INFERENCE */}
        <line x1="282" y1="152" x2="182" y2="192" stroke="url(#g-conn-2)" strokeWidth="4" strokeLinecap="round" opacity="0.18"/>
        <line x1="282" y1="152" x2="182" y2="192" stroke="url(#g-conn-2)" strokeWidth="1.5" strokeDasharray="6 5" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" values="0;-22" dur="1.05s" repeatCount="indefinite"/>
        </line>
        <circle cx="282" cy="152" r="3.5" fill="#c8f135" opacity="0.6" filter="url(#f-glow-sm)"/>
        <circle cx="182" cy="192" r="3"   fill="#c8f135" opacity="0.35"/>
        <circle r="3.5" fill="#c8f135" opacity="0.9" filter="url(#f-glow-md)">
          <animateMotion dur="1.05s" repeatCount="indefinite" calcMode="linear" path="M282,152 L182,192"/>
        </circle>

        {/* Connector: CREDIT GUARD */}
        <line x1="282" y1="283" x2="182" y2="218" stroke="url(#g-conn-3)" strokeWidth="4" strokeLinecap="round" opacity="0.18"/>
        <line x1="282" y1="283" x2="182" y2="218" stroke="url(#g-conn-3)" strokeWidth="1.5" strokeDasharray="6 5" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" values="0;-22" dur="1.7s" repeatCount="indefinite"/>
        </line>
        <circle cx="282" cy="283" r="3.5" fill="#c8f135" opacity="0.6" filter="url(#f-glow-sm)"/>
        <circle cx="182" cy="218" r="3"   fill="#c8f135" opacity="0.35"/>
        <circle r="3.5" fill="#c8f135" opacity="0.9" filter="url(#f-glow-md)">
          <animateMotion dur="1.7s" repeatCount="indefinite" calcMode="linear" path="M282,283 L182,218"/>
        </circle>

        {/* Connector: EVAL LOOP */}
        <line x1="276" y1="363" x2="182" y2="224" stroke="url(#g-conn-4)" strokeWidth="4" strokeLinecap="round" opacity="0.18"/>
        <line x1="276" y1="363" x2="182" y2="224" stroke="url(#g-conn-4)" strokeWidth="1.5" strokeDasharray="6 5" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" values="0;-22" dur="2.0s" repeatCount="indefinite"/>
        </line>
        <circle cx="276" cy="363" r="3.5" fill="#c8f135" opacity="0.6" filter="url(#f-glow-sm)"/>
        <circle cx="182" cy="224" r="3"   fill="#c8f135" opacity="0.35"/>
        <circle r="3.5" fill="#c8f135" opacity="0.9" filter="url(#f-glow-md)">
          <animateMotion dur="2.0s" repeatCount="indefinite" calcMode="linear" path="M276,363 L182,224"/>
        </circle>

        {/* Satellite: RAG PIPELINE */}
        <g filter="url(#f-shadow)">
          <rect x="274" y="56" width="112" height="28" fill="url(#g-sat-body)"/>
          <ellipse cx="330" cy="84" rx="56" ry="11" fill="#141414" stroke="#222" strokeWidth="0.75"/>
          <ellipse cx="330" cy="56" rx="56" ry="11" fill="url(#g-sat-top)" stroke="#c8f135" strokeWidth="0.75"/>
          <ellipse cx="330" cy="56" rx="56" ry="11" fill="url(#g-sat-top-shine)"/>
          <line x1="274" y1="56" x2="274" y2="84" stroke="#404040" strokeWidth="1.5" opacity="0.6"/>
        </g>
        <text x="330" y="56" fontFamily="ui-monospace,monospace" fontSize="10" fontWeight="700" fill="#0d1a00" textAnchor="middle" dominantBaseline="central" letterSpacing="0.08em">RAG PIPELINE</text>

        {/* Satellite: MODEL INFERENCE */}
        <g filter="url(#f-shadow)">
          <rect x="268" y="138" width="124" height="28" fill="url(#g-sat-body)"/>
          <ellipse cx="330" cy="166" rx="62" ry="11" fill="#141414" stroke="#222" strokeWidth="0.75"/>
          <ellipse cx="330" cy="138" rx="62" ry="11" fill="url(#g-sat-top)" stroke="#c8f135" strokeWidth="0.75"/>
          <ellipse cx="330" cy="138" rx="62" ry="11" fill="url(#g-sat-top-shine)"/>
          <line x1="268" y1="138" x2="268" y2="166" stroke="#404040" strokeWidth="1.5" opacity="0.6"/>
        </g>
        <text x="330" y="138" fontFamily="ui-monospace,monospace" fontSize="10" fontWeight="700" fill="#0d1a00" textAnchor="middle" dominantBaseline="central" letterSpacing="0.08em">MODEL INFERENCE</text>

        {/* Satellite: CREDIT GUARD */}
        <g filter="url(#f-shadow)">
          <rect x="268" y="273" width="124" height="28" fill="url(#g-sat-body)"/>
          <ellipse cx="330" cy="301" rx="62" ry="11" fill="#141414" stroke="#222" strokeWidth="0.75"/>
          <ellipse cx="330" cy="273" rx="62" ry="11" fill="url(#g-sat-top)" stroke="#c8f135" strokeWidth="0.75"/>
          <ellipse cx="330" cy="273" rx="62" ry="11" fill="url(#g-sat-top-shine)"/>
          <line x1="268" y1="273" x2="268" y2="301" stroke="#404040" strokeWidth="1.5" opacity="0.6"/>
        </g>
        <text x="330" y="273" fontFamily="ui-monospace,monospace" fontSize="10" fontWeight="700" fill="#0d1a00" textAnchor="middle" dominantBaseline="central" letterSpacing="0.08em">CREDIT GUARD</text>

        {/* Satellite: EVAL LOOP */}
        <g filter="url(#f-shadow)">
          <rect x="274" y="359" width="112" height="28" fill="url(#g-sat-body)"/>
          <ellipse cx="330" cy="387" rx="56" ry="11" fill="#141414" stroke="#222" strokeWidth="0.75"/>
          <ellipse cx="330" cy="359" rx="56" ry="11" fill="url(#g-sat-top)" stroke="#c8f135" strokeWidth="0.75"/>
          <ellipse cx="330" cy="359" rx="56" ry="11" fill="url(#g-sat-top-shine)"/>
          <line x1="274" y1="359" x2="274" y2="387" stroke="#404040" strokeWidth="1.5" opacity="0.6"/>
        </g>
        <text x="330" y="359" fontFamily="ui-monospace,monospace" fontSize="10" fontWeight="700" fill="#0d1a00" textAnchor="middle" dominantBaseline="central" letterSpacing="0.08em">EVAL LOOP</text>

        {/* Central cylinder: AGENT CONTROLLER */}
        <g filter="url(#f-shadow)">
          <rect x="50" y="178" width="264" height="56" fill="url(#g-cyl-body)" clipPath="url(#clip-cyl-body)"/>
          <line x1="50"  y1="178" x2="50"  y2="234" stroke="#555" strokeWidth="2"    opacity="0.5"/>
          <line x1="51"  y1="178" x2="51"  y2="234" stroke="#444" strokeWidth="1"    opacity="0.3"/>
          <line x1="314" y1="178" x2="314" y2="234" stroke="#0a0a0a" strokeWidth="2" opacity="0.8"/>
          <line x1="50" y1="192" x2="314" y2="192" stroke="#2a2a2a" strokeWidth="0.5" opacity="0.5"/>
          <line x1="50" y1="206" x2="314" y2="206" stroke="#222"    strokeWidth="0.5" opacity="0.5"/>
          <line x1="50" y1="220" x2="314" y2="220" stroke="#1e1e1e" strokeWidth="0.5" opacity="0.4"/>
          <ellipse cx="182" cy="234" rx="132" ry="22" fill="#111" stroke="#1e1e1e" strokeWidth="1"/>
          <ellipse cx="182" cy="178" rx="132" ry="22" fill="url(#g-cyl-top)" stroke="#3a3a3a" strokeWidth="1.25"/>
          <ellipse cx="182" cy="178" rx="132" ry="22" fill="url(#g-cyl-rim)" opacity="0.9"/>
          <ellipse cx="182" cy="178" rx="108" ry="18" fill="none" stroke="#2e2e2e" strokeWidth="0.75"/>
          <ellipse cx="182" cy="178" rx="80"  ry="13" fill="none" stroke="#292929" strokeWidth="0.75"/>
          <ellipse cx="182" cy="178" rx="52"  ry="9"  fill="none" stroke="#252525" strokeWidth="0.75"/>
          <ellipse cx="182" cy="178" rx="26"  ry="5"  fill="none" stroke="#222"    strokeWidth="0.5"/>
          <ellipse cx="182" cy="178" rx="132" ry="22" fill="url(#g-cyl-inner)"/>
          <ellipse cx="182" cy="178" rx="132" ry="22" fill="none" stroke="#c8f135" strokeWidth="0.75" strokeOpacity="0.12"/>
        </g>
        <text x="182" y="198" fontFamily="ui-monospace,monospace" fontSize="13" fontWeight="700" fill="#e0e0e0" textAnchor="middle" letterSpacing="0.1em" style={{ textShadow: '0 1px 4px #000' }}>AGENT</text>
        <text x="182" y="218" fontFamily="ui-monospace,monospace" fontSize="13" fontWeight="700" fill="#e0e0e0" textAnchor="middle" letterSpacing="0.1em" style={{ textShadow: '0 1px 4px #000' }}>CONTROLLER</text>
        <text x="182" y="174" fontFamily="ui-monospace,monospace" fontSize="7.5" fontWeight="400" fill="#c8f135" fillOpacity="0.4" textAnchor="middle" letterSpacing="0.14em">v1.0.0</text>

        {/* Hit areas for tooltips */}
        <rect x="274" y="45"  width="112" height="50" rx="4" fill="transparent" className="cursor-pointer" onMouseEnter={(e) => showTip(e, 'rag')}    onMouseLeave={() => setTip(null)}/>
        <rect x="268" y="127" width="124" height="50" rx="4" fill="transparent" className="cursor-pointer" onMouseEnter={(e) => showTip(e, 'model')}  onMouseLeave={() => setTip(null)}/>
        <rect x="268" y="262" width="124" height="50" rx="4" fill="transparent" className="cursor-pointer" onMouseEnter={(e) => showTip(e, 'credit')} onMouseLeave={() => setTip(null)}/>
        <rect x="274" y="348" width="112" height="50" rx="4" fill="transparent" className="cursor-pointer" onMouseEnter={(e) => showTip(e, 'eval')}   onMouseLeave={() => setTip(null)}/>
        <rect x="50"  y="165" width="264" height="92" rx="4" fill="transparent" className="cursor-pointer" onMouseEnter={(e) => showTip(e, 'core')}   onMouseLeave={() => setTip(null)}/>
      </svg>

      {activeTip && tip && (
        <div
          className="absolute pointer-events-none bg-[#1d1d1d] border border-[rgba(255,255,255,0.11)] rounded-[5px] px-3 py-2 font-mono text-[11px] text-[#e8e8e8] z-10 max-w-[200px] leading-relaxed shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          style={{ left: Math.min(tip.x - 10, 230) + 'px', top: tip.y - 90 + 'px' }}
        >
          <span className="block font-semibold text-[#c8f135] text-[10px] tracking-[0.08em] uppercase mb-1">
            {activeTip.title}
          </span>
          {activeTip.body}
        </div>
      )}
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      className="min-h-screen grid grid-cols-1 md:grid-cols-[1fr_520px] pt-[52px]"
    >
      {/* Left column */}
      <div
        className="relative flex flex-col justify-center px-10 py-20 border-r border-[rgba(255,255,255,0.07)]"
        style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 47px, rgba(255,255,255,0.04) 47px, rgba(255,255,255,0.04) 48px)' }}
      >
        {/* Status tag */}
        <div
          className="inline-flex items-center gap-[7px] font-mono text-[11px] text-[#4a4a4a] tracking-[0.06em] mb-9 px-[11px] py-[5px] border border-[rgba(255,255,255,0.11)] rounded-[3px] bg-[#111] w-fit"
          style={{ animation: 'fup 0.5s ease 0.1s both' }}
        >
          <span className="w-[5px] h-[5px] rounded-full bg-[#c8f135]" style={{ animation: 'ppulse 2.4s ease-in-out infinite' }}/>
          v1.0 · founding member window open
        </div>

        {/* Headline */}
        <h1
          className="font-mono font-bold leading-[0.97] tracking-[-0.04em] text-white mb-7"
          style={{ fontSize: 'clamp(40px, 4.8vw, 64px)', animation: 'fup 0.55s ease 0.18s both' }}
        >
          THE HARDENED<br/>
          BOILERPLATE<br/>
          FOR <span className="text-[#c8f135]">AGENTS</span><span className="text-[#4a4a4a]">.</span>
        </h1>

        {/* Body copy */}
        <p
          className="text-[15px] font-light text-[#888888] leading-[1.7] max-w-[460px] mb-10"
          style={{ animation: 'fup 0.55s ease 0.26s both' }}
        >
          Skip <strong className="text-[#e8e8e8] font-normal">40–80 hours</strong> of architecture work. Deploy a billable AI product in one day — auth, agents, RAG, billing, credit guards, all wired together and ready to ship.
        </p>

        {/* Stack line */}
        <p
          className="font-mono text-[11px] text-[#4a4a4a] tracking-[0.03em] mb-9 -mt-7"
          style={{ animation: 'fup 0.55s ease 0.30s both' }}
        >
          <strong className="text-[#888888] font-normal">Next.js 16 · AI SDK 6 · Supabase · Auth.js v5 · Lemon Squeezy · pgvector</strong>
        </p>

        {/* CTAs */}
        <div
          className="flex items-center gap-2.5 mb-[52px] flex-wrap"
          style={{ animation: 'fup 0.55s ease 0.34s both' }}
        >
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-[#c8f135] text-[#0a0a0a] font-mono text-[13px] font-bold px-6 py-[11px] rounded-[5px] transition-[opacity,transform] duration-150 hover:opacity-[0.88] hover:-translate-y-px"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Get AgentZero — $129
          </a>
          <a
            href="#manifest"
            className="inline-flex items-center gap-2 bg-transparent text-[#888888] font-mono text-[13px] px-[18px] py-[11px] rounded-[5px] border border-[rgba(255,255,255,0.11)] transition-[color,border-color,background] duration-150 hover:text-[#e8e8e8] hover:border-[rgba(255,255,255,0.18)] hover:bg-[#161616]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Read the architecture
          </a>
        </div>

        {/* Price note */}
        <p
          className="font-mono text-[11px] text-[#4a4a4a] -mt-9 mb-9 tracking-[0.02em]"
          style={{ animation: 'fup 0.55s ease 0.38s both' }}
        >
          Founding member price — <span className="line-through text-[#2e2e2e]">$249</span> $129. One-time. No subscription.
        </p>

        {/* Proof pills */}
        <div className="flex gap-2 flex-wrap" style={{ animation: 'fup 0.55s ease 0.42s both' }}>
          {PROOF_PILLS.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-[6px] font-mono text-[11px] text-[#4a4a4a] px-[10px] py-1 border border-[rgba(255,255,255,0.07)] rounded-full bg-[#111111] tracking-[0.02em]"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3ddc84" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {label}
            </span>
          ))}
        </div>

        {/* Terminal */}
        <div
          className="mt-11 max-w-[500px] bg-[#111111] border border-[rgba(255,255,255,0.11)] rounded-lg overflow-hidden relative z-10"
          style={{ animation: 'fup 0.55s ease 0.5s both' }}
        >
          <div className="flex items-center gap-1.5 px-3.5 py-[9px] bg-[#161616] border-b border-[rgba(255,255,255,0.07)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"/>
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"/>
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"/>
            <span className="ml-1.5 font-mono text-[11px] text-[#4a4a4a]">bash — ~/projects</span>
          </div>
          <div className="px-[18px] py-4 font-mono text-[12.5px] leading-[2] flex flex-col">
            <span>
              <span className="text-[#4a4a4a]">$ </span>
              <span className="text-[#c8f135]">git</span>
              <span className="text-[#e8e8e8]"> clone https://github.com/agentzero/boilerplate</span>
              <span className="inline-block w-[7px] h-[13px] bg-[#c8f135] align-middle ml-0.5" style={{ animation: 'blink 1s step-end infinite' }}/>
            </span>
            <span className="text-[#4a4a4a] opacity-0" style={{ animation: 'fup 0.35s ease 1.3s both' }}>  Cloning into &apos;boilerplate&apos;...</span>
            <span className="text-[#4a4a4a] opacity-0" style={{ animation: 'fup 0.35s ease 1.8s both' }}>  remote: Enumerating objects: 1,842 done.</span>
            <span className="text-[#4a4a4a] opacity-0" style={{ animation: 'fup 0.35s ease 2.3s both' }}>  Receiving objects: 100% (1842/1842), 4.2 MB</span>
            <span className="text-[#4a4a4a] opacity-0" style={{ animation: 'fup 0.35s ease 2.8s both' }}>
              <span className="text-[#4a4a4a]">$ </span>
              <span className="text-[#c8f135]">cp</span>
              <span className="text-[#e8e8e8]"> .env.example .env.local</span>
            </span>
            <span className="text-[#3ddc84] opacity-0" style={{ animation: 'fup 0.35s ease 3.2s both' }}>  ✓ ready. fill in your keys and deploy.</span>
          </div>
        </div>
      </div>

      {/* Right column — arch diagram, hidden on mobile */}
      <div
        className="hidden md:flex flex-col bg-[#111111] relative overflow-hidden"
        style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent 0px, transparent 51px, rgba(255,255,255,0.04) 51px, rgba(255,255,255,0.04) 52px)' }}
      >
        <ArchDiagram />
      </div>
    </section>
  )
}
