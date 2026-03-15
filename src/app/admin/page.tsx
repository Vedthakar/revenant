"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiFetch } from "@/lib/api";
import type { AdminEngineerItem, AdminHabitLogItem } from "@/types/symbiote";

export default function AdminPage() {
  const { user, loading } = useAuthGuard({ requireAdmin: true });
  const [engineers, setEngineers] = useState<AdminEngineerItem[]>([]);
  const [logs, setLogs] = useState<AdminHabitLogItem[]>([]);
  const [busyLogId, setBusyLogId] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [engineerFilter, setEngineerFilter] = useState("");

  const loadLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (labelFilter) params.set("label", labelFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    if (engineerFilter) params.set("engineer_id", engineerFilter);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<AdminHabitLogItem[]>(`/api/admin/logs${suffix}`);
    setLogs(data);
  }, [engineerFilter, labelFilter, sourceFilter]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFetching(true);
    Promise.all([
      apiFetch<AdminEngineerItem[]>("/api/admin/engineers"),
      loadLogs(),
    ])
      .then(([engineerRows]) => {
        setEngineers(engineerRows);
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin data");
      })
      .finally(() => setFetching(false));
  }, [loadLogs, user]);

  useEffect(() => {
    if (user) {
      void loadLogs();
    }
  }, [engineerFilter, labelFilter, loadLogs, sourceFilter, user]);

  const sources = useMemo(() => Array.from(new Set(logs.map((log) => log.source))).sort(), [logs]);

  const updateLabel = async (logId: number, label: "good" | "bad" | "neutral") => {
    setBusyLogId(logId);
    setError(null);
    try {
      await apiFetch<AdminHabitLogItem>(`/api/admin/logs/${logId}`, {
        method: "PATCH",
        json: { label },
      });
      await Promise.all([
        loadLogs(),
        apiFetch<AdminEngineerItem[]>("/api/admin/engineers").then(setEngineers),
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update label");
    } finally {
      setBusyLogId(null);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div>
          <span className="tag tag-gold">Review control</span>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">Audit labels, promotions, and memory quality.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
            This is Revenent's manual override loop. Review incoming signals, correct labels, and keep the promotion engine defensible before company memory hardens around bad assumptions.
          </p>
        </div>

        {error ? <p className="mt-8 rounded-[20px] border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</p> : null}

        {loading || fetching ? (
          <div className="mt-10 grid gap-6">
            <div className="glass h-64 animate-pulse rounded-[28px]" />
            <div className="glass h-96 animate-pulse rounded-[28px]" />
          </div>
        ) : (
          <div className="mt-10 grid gap-6">
            <section className="glass rounded-[28px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Team overview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Observed engineers</h2>
                </div>
                <span className="tag">{engineers.length} engineers</span>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    <tr>
                      <th className="pb-4 pr-6">Engineer</th>
                      <th className="pb-4 pr-6">Email</th>
                      <th className="pb-4 pr-6">Score</th>
                      <th className="pb-4 pr-6">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineers.map((engineerRow) => (
                      <tr key={engineerRow.id} className="border-t border-[var(--border)] text-[var(--text)]">
                        <td className="py-4 pr-6">{engineerRow.full_name || engineerRow.username}</td>
                        <td className="py-4 pr-6 text-[var(--text-muted)]">{engineerRow.email}</td>
                        <td className="py-4 pr-6">{Math.round(engineerRow.habit_score)}</td>
                        <td className="py-4 pr-6">{engineerRow.is_admin ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="glass rounded-[28px] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Manual review</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Behavior batches</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none" value={labelFilter} onChange={(event) => setLabelFilter(event.target.value)}>
                    <option value="">All labels</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="bad">Bad</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                    <option value="">All sources</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  <select className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none" value={engineerFilter} onChange={(event) => setEngineerFilter(event.target.value)}>
                    <option value="">All engineers</option>
                    {engineers.map((engineerRow) => (
                      <option key={engineerRow.id} value={engineerRow.id}>{engineerRow.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    <tr>
                      <th className="pb-4 pr-6">Engineer</th>
                      <th className="pb-4 pr-6">Summary</th>
                      <th className="pb-4 pr-6">Source</th>
                      <th className="pb-4 pr-6">Label</th>
                      <th className="pb-4 pr-6">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-[var(--border)] align-top text-[var(--text)]">
                        <td className="py-4 pr-6">
                          <p>{log.engineer_username}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{log.engineer_email}</p>
                        </td>
                        <td className="py-4 pr-6">
                          <p>{log.summary}</p>
                          {log.evaluation_notes ? <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{log.evaluation_notes}</p> : null}
                        </td>
                        <td className="py-4 pr-6 capitalize text-[var(--text-muted)]">{log.source}</td>
                        <td className="py-4 pr-6">
                          <select
                            className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-[var(--text)] outline-none"
                            value={log.label}
                            disabled={busyLogId === log.id}
                            onChange={(event) => {
                              const nextLabel = event.target.value as "good" | "bad" | "neutral";
                              void updateLabel(log.id, nextLabel);
                            }}
                          >
                            <option value="good">Good</option>
                            <option value="neutral">Neutral</option>
                            <option value="bad">Bad</option>
                            {log.label === "pending" ? <option value="pending">Pending</option> : null}
                          </select>
                        </td>
                        <td className="py-4 pr-6 text-[var(--text-muted)]">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
