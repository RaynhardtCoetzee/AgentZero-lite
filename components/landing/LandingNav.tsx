const NAV_LINKS = [
  { label: 'Stack',    href: '#stack' },
  { label: 'Manifest', href: '#manifest' },
  { label: 'Docs',     href: '#' },
  { label: 'Log',      href: '#log' },
]

export function LandingNav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center px-10 border-b border-[rgba(255,255,255,0.07)]"
      style={{ background: 'rgba(11,11,11,0.82)', backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <a href="#" className="font-mono font-semibold text-[15px] tracking-[-0.03em] text-white no-underline">
        AgentZero<span className="text-[#c8f135]">.</span>
      </a>

      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="font-mono text-xs text-[#4a4a4a] px-3 py-1.5 rounded hover:text-[#e8e8e8] hover:bg-[rgba(255,255,255,0.07)] transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        href="#pricing"
        className="ml-auto font-mono text-xs font-semibold text-[#0b0b0b] bg-[#c8f135] px-4 py-1.5 rounded hover:opacity-85 transition-opacity whitespace-nowrap"
      >
        Get AgentZero — $129
      </a>
    </header>
  )
}
