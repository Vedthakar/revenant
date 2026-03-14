"use client";

import { useEffect, useState } from "react";

import ActivityFeed from "@/components/ActivityFeed";
import HabitChart from "@/components/HabitChart";
import HabitScoreDisplay from "@/components/HabitScoreDisplay";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiFetch } from "@/lib/api";
import type {
  DashboardSummaryResponse,
  HabitLogItem,
  HabitScorePoint,
  IntegrationStatusItem,
} from "@/types/symbiote";

export default function DashboardPage() {
  const { user, loading } = useAuthGuard();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [activity, setActivity] = useState<HabitLogItem[]>([]);
  const [chartData, setChartData] = useState<HabitScorePoint[]>([]);
  const [promoted, setPromoted] = useState<HabitLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    Promise.all([
      apiFetch<DashboardSummaryResponse>("/api/dashboard/summary"),
      apiFetch<HabitLogItem[]>("/api/dashboard/activity?limit=20"),
      apiFetch<HabitScorePoint[]>("/api/dashboard/chart-data"),
      apiFetch<HabitLogItem[]>("/api/dashboard/promoted"),
    ])
      .then(([summaryRes, activityRes, chartRes, promotedRes]) => {
        setSummary(summaryRes);
        setActivity(activityRes);
        setChartData(chartRes);
        setPromoted(promotedRes);
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard");
      })
      .finally(() => setFetching(false));
  }, [user]);

  const integrations: IntegrationStatusItem[] = summary?.connected_integrations || [];

  return (
    <div className="page-shell min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="tag tag-gold">Engineer dashboard</span>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">Habit intelligence for the last 30 days.</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Watch your score evolve, review each labeled action, and track the best moments that graduate into company-wide knowledge.
            </p>
          </div>
        </div>

        {error ? <p className="mt-8 rounded-[20px] border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</p> : null}

        {loading || fetching || !summary ? (
          <div className="mt-10 grid gap-6">
            <div className="glass h-44 animate-pulse rounded-[28px]" />
            <div className="glass h-96 animate-pulse rounded-[28px]" />
          </div>
        ) : (
          <div className="mt-10 grid gap-6">
            <HabitScoreDisplay score={summary.habit_score} />

            <section className="grid gap-4 md:grid-cols-3">
              {[
                ["Good habits", summary.good_count, "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"],
                ["Neutral habits", summary.neutral_count, "border-slate-500/40 bg-slate-500/10 text-slate-200"],
                ["Bad habits", summary.bad_count, "border-red-500/40 bg-red-500/10 text-red-300"],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="glass rounded-[24px] p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</p>
                  <div className={`mt-4 inline-flex rounded-full border px-4 py-2 text-2xl font-semibold ${tone}`}>{value}</div>
                </div>
              ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <HabitChart data={chartData} />
              <section className="glass rounded-[28px] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Connected tools</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">Sync status</h3>
                <div className="mt-6 flex flex-col gap-4">
                  {integrations.map((integration) => (
                    <div key={integration.provider} className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium capitalize text-[var(--text)]">{integration.provider}</p>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${integration.connected ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-muted)]"}`}>
                          {integration.connected ? "Connected" : "Not connected"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                        Last sync: {integration.last_synced ? new Date(integration.last_synced).toLocaleString() : "Never"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <ActivityFeed items={activity} />
              <section className="glass rounded-[28px] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Promotion engine</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">Promoted to Company</h3>
                <div className="mt-6 flex flex-col gap-4">
                  {promoted.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-[var(--border)] p-5 text-sm leading-6 text-[var(--text-muted)]">
                      No habits have been promoted yet. When a standout moment is detected in a labeled batch, it will appear here.
                    </div>
                  ) : (
                    promoted.map((item) => (
                      <article key={item.id} className="rounded-[20px] border border-[var(--border-gold)] bg-[rgba(217,119,6,0.06)] p-5">
                        <p className="text-sm font-medium text-[var(--text)]">{item.summary}</p>
                        {item.evaluation_notes ? (
                          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{item.evaluation_notes}</p>
                        ) : null}
                        <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[var(--gold)]">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
