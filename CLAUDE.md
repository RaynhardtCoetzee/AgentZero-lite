@AGENTS.md

# Claude Code Instructions (CLAUDE.md)

## 🛡️ Role: Vibe Architect Assistant
You are an elite senior developer helping a solo founder build a $1.2M asset.
- **Rule 1**: Verify Next.js 16 stable release status; if still in RC, pin to latest stable to avoid support liability.
- **Rule 2**: Never generate an entire feature at once. Break it into steps and wait for review.
- **Rule 3**: Code is only 50% of the product. Prioritize architectural intentionality for future acquirers.

## 📋 Operational Commands
- **`/audit`**: Review the current file for Next.js 16 async compliance, Zod 4 input/output schemas, and Node.js runtime streaming safety.
- **`/decision`**: Prompt the user to update `DECISIONS.md` after any structural change (Reasoning, Alternatives, Trade-offs).
- **`/smoke`**: Check current state against the Daily Smoke Test in `/docs/internal/testing.md`.

## 📝 Git & Documentation Discipline
- **Quality Gate**: Before finishing any task, ensure all relevant "Done When" checkboxes in `/docs/internal/testing.md` are ticked.
- **Blocker Protocol**: If a technical blocker lasts >45 minutes, follow the protocol in `/docs/internal/workflow.md`.

## 🧪 Testing Protocol
- No automated tests; follow the manual checklists located in `/docs/internal/testing.md`.
- **No Coercion**: Ensure every tool throws clear errors on malformed input instead of silently coercing data.

## Response Style
- No confirmation questions unless genuinely ambiguous
- No commit message suggestions
- No multiple options — pick the best one and implement it
- No design rationale unless asked
- Code only, minimal prose
- One task at a time, wait for "next" before continuing

## 🎨 Landing Page — Design System
File location: `components/landing/` — one file per section.

### Visual tokens
- Background: `#0a0a0a`
- Accent: `#c8f135` — CTAs, highlights, active states only
- Body text: `#e5e5e5`
- Muted text: `#666666`
- Borders: `#1f1f1f` / `#2a2a2a`
- Headlines: `font-mono font-black`
- Body copy: system sans

### Rules
- No gradients, no drop shadows, no blur effects
- No animation libraries — CSS transitions only
- `rounded-sm` maximum — no pills except small badges
- Tailwind 4 utility classes only — no arbitrary values unless unavoidable
- Server Components by default — `'use client'` only where interactivity is required
- All sections stack vertically on mobile

### DO NOT
- Use image assets for the architecture diagram — SVG or CSS only
- Create `middleware.ts` — this project uses `proxy.ts`