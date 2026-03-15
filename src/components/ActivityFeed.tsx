"use client";

import type { HabitLabel, HabitLogItem } from "@/types/symbiote";

interface ActivityFeedProps {
  items: HabitLogItem[];
  title?: string;
}

function labelTone(label: HabitLabel) {
  switch (label) {
    case "good":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "bad":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "neutral":
      return "border-slate-500/40 bg-slate-500/10 text-slate-200";
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
}

export default function ActivityFeed({ items, title = "Recent observed activity" }: ActivityFeedProps) {
  return (
    <section className="glass flex flex-col gap-5 rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Feed</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">{title}</h3>
        </div>
        <span className="tag">{items.length} entries</span>
      </div>

      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[var(--border)] p-5 text-sm text-[var(--text-muted)]">
            No source activity yet. Connect GitHub through Nango and Revenant will start building both personal and company memory from incoming events.
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{item.summary || item.action_type}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {item.source} | {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${labelTone(item.label)}`}>
                  {item.label}
                </span>
              </div>
              {item.evaluation_notes ? (
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{item.evaluation_notes}</p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
