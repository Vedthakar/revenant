"use client";

import { useEffect, useState } from "react";

const SOURCES = [
  { name: "SLACK-WS", status: "ACTIVE", latency: "12ms" },
  { name: "GITHUB-ORG", status: "ACTIVE", latency: "8ms" },
  { name: "JIRA-PROJ", status: "SYNCING", latency: "34ms" },
  { name: "GMAIL-DOMAIN", status: "ACTIVE", latency: "11ms" },
];

export function StatusCard() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          integrations.status
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          {`TICK:${String(tick).padStart(4, "0")}`}
        </span>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-0">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-2 border-b border-border pb-2 mb-2">
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
            Source
          </span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
            Status
          </span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground text-right">
            Latency
          </span>
        </div>
        {SOURCES.map((source) => (
          <div
            key={source.name}
            className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-none"
          >
            <span className="text-xs font-mono text-foreground">{source.name}</span>
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5"
                style={{
                  backgroundColor:
                    source.status === "ACTIVE"
                      ? "#ea580c"
                      : "hsl(var(--color-muted-foreground))",
                }}
              />
              <span className="text-xs font-mono text-muted-foreground">{source.status}</span>
            </div>
            <span className="text-xs font-mono text-foreground text-right">{source.latency}</span>
          </div>
        ))}
        {/* Memory sync bar */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
              Memory Sync
            </span>
            <span className="text-[9px] font-mono text-foreground">92%</span>
          </div>
          <div className="h-2 w-full border border-foreground">
            <div className="h-full bg-foreground" style={{ width: "92%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
