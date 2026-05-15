const NAV_LINKS = [
  { label: 'Stack',    href: '#stack' },
  { label: 'Manifest', href: '#manifest' },
  { label: 'Docs',     href: '#' },
  { label: 'Log',      href: '#log' },
]

export function LandingNav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center px-4 sm:px-6 md:px-10 border-b border-white/[7%] safe-pl safe-pr"
      style={{ background: 'rgba(11,11,11,0.82)', backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <a href="#" className="font-mono font-semibold text-[14px] sm:text-[15px] tracking-[-0.03em] text-foreground no-underline">
        AgentZero<span className="text-primary">.</span>
      </a>

      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="font-mono text-xs text-muted-foreground/50 px-3 py-1.5 rounded hover:text-foreground hover:bg-white/[7%] transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        href="#pricing"
        className="ml-auto font-mono text-[11px] sm:text-xs font-semibold text-primary-foreground bg-primary px-3 sm:px-4 py-2 rounded hover:opacity-85 transition-opacity whitespace-nowrap"
      >
        <span className="sm:hidden">Get — $129</span>
        <span className="hidden sm:inline">Get AgentZero — $129</span>
      </a>
    </header>
  )
}
