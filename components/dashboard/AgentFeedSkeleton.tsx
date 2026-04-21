/**
 * components/dashboard/AgentFeedSkeleton.tsx
 *
 * Suspense fallback for the AgentFeed component.
 * Renders three placeholder agent cards that match the dark theme.
 * The third card fades out to imply a longer list below the fold.
 */

export function AgentFeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 animate-pulse"
          style={{ opacity: i === 3 ? 0.4 : 1 }}
        >
          {/* Row 1: status dot + name + badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
            <div className="h-3 w-36 rounded bg-muted" />
            <div className="ml-auto h-5 w-16 rounded-full bg-muted" />
          </div>

          {/* Row 2: description */}
          <div className="mb-3 pl-5 space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>

          {/* Row 3: last run + action */}
          <div className="flex items-center justify-between pl-5">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
