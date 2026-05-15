/**
 * Design System Tokens
 * ─────────────────────
 * Single source of truth for visual design.
 * NEVER use arbitrary color values — always reference these tokens.
 *
 * All values are CSS variables managed in app/globals.css.
 * Use them via className utilities in Tailwind (e.g., bg-background, text-foreground).
 */

export const designTokens = {
  /**
   * CORE SURFACES
   * ─────────────
   * Use for page/container backgrounds. Apply at root level.
   */
  colors: {
    background: "var(--background)", // oklch(0.13 0 0) → #0a0a0a
    foreground: "var(--foreground)", // oklch(0.985 0 0) → #e5e5e5 — body text
    card: "var(--card)", // oklch(0.17 0 0) — card backgrounds
    "card-foreground": "var(--card-foreground)",

    /**
     * PRIMARY + SECONDARY
     * ────────────────────
     * Primary is the accent color (#22C55E — Emerald Neon).
     * Use only for CTAs, active states, highlights.
     * Secondary is muted dark gray for secondary content.
     */
    primary: "var(--primary)", // #22C55E — Emerald Neon
    "primary-foreground": "var(--primary-foreground)",
    secondary: "var(--secondary)", // oklch(0.20 0 0) — dark gray
    "secondary-foreground": "var(--secondary-foreground)",

    /**
     * MUTED SURFACES + TEXT
     * ──────────────────────
     * Use for disabled states, secondary labels, metadata.
     */
    muted: "var(--muted)", // oklch(0.20 0 0) — muted surface
    "muted-foreground": "var(--muted-foreground)", // oklch(0.60 0 0) → #666666 — secondary text

    /**
     * ACCENT (ALIAS FOR PRIMARY)
     * ───────────────────────────
     * Use interchangeably with primary in Tailwind.
     */
    accent: "var(--accent)", // #22C55E — Emerald Neon
    "accent-foreground": "var(--accent-foreground)",

    /**
     * BORDERS + INPUTS
     * ────────────────
     * Subtle divider lines and form input backgrounds.
     */
    border: "var(--border)", // oklch(1 0 0 / 8%) — subtle 8% white
    input: "var(--input)", // oklch(1 0 0 / 12%) — form input bg
    ring: "var(--ring)", // #22C55E — focus ring (accent green)

    /**
     * DESTRUCTIVE & STATUS
     * ───────────
     * Error states, delete buttons, and warnings.
     */
    destructive: "var(--destructive)", // oklch(0.704 0.191 22.216) — red
    "status-warning": "var(--status-warning)",
    "status-warning-fg": "var(--status-warning-fg)",

    /**
     * SIDEBAR TOKENS
     * ──────────────
     * Isolated theme for the navigation sidebar.
     */
    "sidebar-bg": "var(--sidebar)", // oklch(0.10 0 0) — very dark
    "sidebar-foreground": "var(--sidebar-foreground)",
    "sidebar-primary": "var(--sidebar-primary)", // #22C55E
    "sidebar-accent": "var(--sidebar-accent)",
    "sidebar-border": "var(--sidebar-border)",
  },

  /**
   * GLASS SURFACES
   * ──────────────
   * Semi-transparent overlays with backdrop blur.
   * Three tiers: use glass-1 for chrome, glass-2 for cards, glass-3 for modals.
   */
  glass: {
    "glass-1": "var(--glass-1-bg)", // rgba(255, 255, 255, 0.025) — subtle
    "glass-1-border": "var(--glass-1-border)", // rgba(255, 255, 255, 0.06)
    "glass-2": "var(--glass-2-bg)", // rgba(255, 255, 255, 0.045) — cards
    "glass-2-border": "var(--glass-2-border)", // rgba(255, 255, 255, 0.08)
    "glass-3": "var(--glass-3-bg)", // rgba(255, 255, 255, 0.07) — modals
    "glass-3-border": "var(--glass-3-border)", // rgba(255, 255, 255, 0.10)
    "glass-hover": "var(--glass-hover)", // rgba(255, 255, 255, 0.06)
    "glass-active": "var(--glass-active)", // rgba(34, 197, 94, 0.10) — accent tint
  },

  /**
   * RADIUS
   * ──────
   * Roundedness scale. Max is rounded-sm per CLAUDE.md.
   */
  radius: {
    sm: "calc(var(--radius) * 0.6)", // ~3.75px
    md: "calc(var(--radius) * 0.8)", // ~5px
    lg: "var(--radius)", // ~10px (base)
    xl: "calc(var(--radius) * 1.4)",
    "2xl": "calc(var(--radius) * 1.8)",
    "3xl": "calc(var(--radius) * 2.2)",
    "4xl": "calc(var(--radius) * 2.6)",
  },

  /**
   * MOTION
   * ──────
   * Animation durations and easings.
   */
  motion: {
    fast: "var(--t-fast)", // 120ms — hover states
    base: "var(--t-base)", // 200ms — everything else
    slow: "var(--t-slow)", // 320ms — entrances
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },

  /**
   * LAYOUT
   * ──────
   * Structural constants.
   */
  layout: {
    mobileNavHeight: "var(--mobile-nav-h)", // 64px
  },
} as const;

/**
 * USAGE GUIDE
 * ───────────
 *
 * 1. BACKGROUND + TEXT PAIRS (most common)
 *    ✓ bg-background text-foreground — page background
 *    ✓ bg-card text-card-foreground — card backgrounds
 *    ✓ bg-secondary text-secondary-foreground — secondary surfaces
 *
 * 2. ACCENT (CTAs, active states, highlights ONLY)
 *    ✓ bg-primary — accent button background
 *    ✓ text-primary — accent text (e.g., active nav item)
 *    ✓ border-primary — accent border (active state)
 *    ✗ DO NOT use primary for regular surfaces
 *
 * 3. SECONDARY TEXT (metadata, helper text, timestamps)
 *    ✓ text-muted-foreground — secondary text
 *    ✓ text-sm text-muted-foreground — metadata
 *    ✗ DO NOT use muted for whole sections
 *
 * 4. GLASS OVERLAYS (modals, dropdowns, floating panels)
 *    ✓ class="glass-2" — for cards
 *    ✓ class="glass-3" — for modals/popovers
 *    ✗ DO NOT use .glass-* on the landing page (keep it minimal)
 *
 * 5. RADIUS (always use Tailwind utilities, never arbitrary)
 *    ✓ rounded-sm — default max per CLAUDE.md
 *    ✓ rounded-md — slightly rounder
 *    ✗ DO NOT use rounded-full or arbitrary px values
 *
 * 6. ANIMATION (CSS transitions only, no libraries)
 *    ✓ transition-colors duration-200 — button hover
 *    ✓ animation: fup var(--t-slow) — entrance animation
 *    ✗ DO NOT use animation libraries (Framer, Animate On Scroll, etc.)
 */
