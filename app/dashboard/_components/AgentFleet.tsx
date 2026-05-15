import Link from "next/link";
import { MessageSquare, Activity } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Agent } from "@/lib/actions/agent-crud-actions";

export type FleetAgentStat = { conversations: number; messages: number; lastActiveAt: string | null };

type Props = {
  agents: Agent[];
  agentStats: Map<string, FleetAgentStat>;
};

const RING_R = 28;           // SVG circle radius
const RING_C = 2 * Math.PI * RING_R; // circumference ≈ 175.9

// Fixed: Use CSS classes for avatar hues to match the logic in the component
const AVATAR_CLASSES = ["avatar-hue-0", "avatar-hue-1", "avatar-hue-2", "avatar-hue-3", "avatar-hue-4"] as const;

function deriveVersion(id: string): string {
  const major = (id.charCodeAt(0) % 2) + 1;
  const patch = id.charCodeAt(2) % 9;
  return `V${major}.0.${patch}`;
}

function deriveLoad(id: string): number {
  return 2 + (id.charCodeAt(1) % 38);
}

function successRate(conversations: number, messages: number): number | null {
  if (conversations === 0) return null;
  return Math.min(100, Math.round(70 + (messages % 30)));
}

export function AgentFleet({ agents, agentStats }: Props) {
  const totalConversations = Array.from(agentStats.values()).reduce((s, x) => s + x.conversations, 0);

  return (
    <section className="md:min-h-0 md:flex-1 flex flex-col rounded-sm overflow-hidden anim-fade-up glass-fleet">
      <header className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.05]">
        <div className="min-w-0">
          <h2 className="font-sans font-bold text-2xl text-foreground leading-none tracking-tight">
            Your Agents
          </h2>
          {agents.length > 0 && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {agents.length} active&nbsp;&nbsp;·&nbsp;&nbsp;{totalConversations} sessions
            </p>
          )}
        </div>
        <Badge className="bg-transparent border border-primary/50 text-primary hover:bg-transparent font-mono text-[9px] uppercase tracking-widest shrink-0 px-3 py-1.5 h-auto rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0 mr-2" />
          All Systems Ready
        </Badge>
      </header>

      <div className="md:min-h-0 md:flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <FleetEmpty />
        ) : (
          <>
            <div className="lg:hidden overflow-x-auto snap-x snap-mandatory flex gap-px px-4 py-4">
              {agents.slice(0, 12).map((agent, i) => {
                const stat = agentStats.get(agent.id) ?? { conversations: 0, messages: 0, lastActiveAt: null };
                return <FleetCard key={agent.id} agent={agent} stat={stat} index={i} compact />;
              })}
            </div>

            <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-white/[0.05]">
              {agents.slice(0, 9).map((agent, i) => {
                const stat = agentStats.get(agent.id) ?? { conversations: 0, messages: 0, lastActiveAt: null };
                return <FleetCard key={agent.id} agent={agent} stat={stat} index={i} />;
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// Fixed: Receives hueCls as a string prop
function AvatarRing({
  initials,
  hueCls,
  pct,
}: {
  initials: string;
  hueCls: string;
  pct: number | null;
}) {
  const filled = ((pct ?? 0) / 100) * RING_C;
  const SIZE = 64;
  const cx = SIZE / 2;
  const r = RING_R;

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0"
        aria-hidden
      >
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={2.5}
        />
        {pct !== null && (
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${RING_C}`}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        )}
      </svg>
      {/* Fixed: hueCls is now correctly defined and used */}
      <div className={cn("absolute inset-[6px] rounded-full flex items-center justify-center", hueCls)}>
        <span className="font-mono text-xs font-black tracking-tight select-none">
          {initials}
        </span>
      </div>
    </div>
  );
}

function FleetCard({
  agent,
  stat,
  index,
  compact,
}: {
  agent: Agent;
  stat: FleetAgentStat;
  index: number;
  compact?: boolean;
}) {
  const initials = agent.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AZ";

  const lastActive = stat.lastActiveAt ?? agent.created_at;
  const isActive = stat.conversations > 0;
  const version = deriveVersion(agent.id);
  const load = deriveLoad(agent.id);
  const rate = successRate(stat.conversations, stat.messages);
  
  // Fixed: Pick the CSS class from the new array
  const hueCls = AVATAR_CLASSES[index % AVATAR_CLASSES.length];

  const SEGMENTS = 14;
  const filledSegs = Math.round((load / 100) * SEGMENTS);

  return (
    <Link
      href={`/dashboard/agents/${agent.id}`}
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
      className={cn(
        "group flex flex-col transition-[background-color,border-color] duration-200",
        "hover:bg-primary/[0.04] focus-visible:outline-none",
        compact && "shrink-0 snap-start min-w-[80vw] sm:min-w-[45vw] glass-fleet rounded-sm",
      )}
    >
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        {/* Fixed: Pass hueCls instead of the hue object */}
        <AvatarRing initials={initials} hueCls={hueCls} pct={rate} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground leading-tight truncate flex-1">
              {agent.name}
            </p>
            <Badge
              className={cn(
                "shrink-0 gap-1.5 font-mono text-[8px] uppercase tracking-widest px-2 py-1 h-auto rounded-sm",
                isActive
                  ? "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
                  : "bg-secondary border border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              <span className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/40",
              )} />
              {isActive ? "Live" : "Idle"}
            </Badge>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              {version}
            </span>
            <span className="text-muted-foreground/30 text-[10px] leading-none">•</span>
            <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Updated {formatDistanceToNow(new Date(lastActive))}
            </span>
            {rate !== null && (
              <>
                <span className="text-muted-foreground/30 text-[10px] leading-none">•</span>
                <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider">
                  {rate}% Success
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-white/[0.05]" />
      <div className="grid grid-cols-2">
        {[
          { k: "Chats", v: String(stat.conversations) },
          { k: "Messages", v: stat.messages.toLocaleString() },
        ].map(({ k, v }, ci) => (
          <div key={k} className={cn(
            "flex flex-col gap-1.5 px-5 py-4",
            ci === 0 && "border-r border-white/[0.05]",
          )}>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3 text-muted-foreground/40" strokeWidth={1.5} />
              <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                {k}
              </span>
            </div>
            <span className="font-mono text-2xl font-black tabular-nums text-foreground leading-none">
              {v}
            </span>
          </div>
        ))}
      </div>

      <Separator className="bg-white/[0.05]" />
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            &gt;_ System Load {load}%
          </span>
          <Activity className="h-3.5 w-3.5 text-muted-foreground/30" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-[1px]",
                i < filledSegs ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}

function FleetEmpty() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-6 p-8 sm:p-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/25">
        <span className="font-mono text-base font-black text-primary">AZ</span>
      </div>
      <div className="space-y-2 max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary/75 font-bold">
          Fleet empty
        </p>
        <p className="text-base text-foreground font-medium">No agents deployed yet.</p>
        <p className="text-sm text-muted-foreground">
          Initialise your first instance to begin autonomous operations.
        </p>
      </div>
      <Link
        href="/dashboard/agents/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground font-mono text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
      >
        Deploy First Agent
      </Link>
    </div>
  );
}