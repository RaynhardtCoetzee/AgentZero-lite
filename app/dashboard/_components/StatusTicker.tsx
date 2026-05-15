"use client";

interface StatusTickerProps {
  messages: string[];
}

const TIMESTAMPS = ["00:00:01", "00:00:03", "00:00:04", "00:00:06", "00:00:09", "00:00:11"];

export function StatusTicker({ messages }: StatusTickerProps) {
  const entries = messages
    .map((msg, i) => `${TIMESTAMPS[i % TIMESTAMPS.length]}  ${msg}`)
    .join("          ");

  const content = `${entries}          ${entries}`;

  return (
    <div className="overflow-hidden border-t border-white/6 bg-white/2 flex items-center gap-3 pr-4">
      {/* LIVE badge — static, outside the scroll */}
      <div className="shrink-0 flex items-center gap-1.5 pl-3 py-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animation: "blink 1.2s step-start infinite" }}
        />
        <span className="font-mono text-[7px] uppercase tracking-widest text-primary/60 font-bold">
          live
        </span>
      </div>
      <div className="w-px h-3 bg-white/10 shrink-0" />
      {/* Scrolling log line */}
      <p
        className="whitespace-nowrap font-mono text-[8px] tracking-wider text-muted-foreground/40 py-1.5 flex-1"
        style={{ animation: "marquee 45s linear infinite" }}
      >
        {content}
      </p>
    </div>
  );
}