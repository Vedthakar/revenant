"use client";

import { CheckCircle2, Clock3, Github, MessageCircleMore, PlugZap } from "lucide-react";

import type { IntegrationStatusItem } from "@/types/symbiote";

interface IntegrationCardProps {
  integration: IntegrationStatusItem;
  description: string;
  busy?: boolean;
  onConnect: (provider: string) => void;
}

const icons: Record<string, typeof Github> = {
  github: Github,
  discord: MessageCircleMore,
};

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

export default function IntegrationCard({ integration, description, busy = false, onConnect }: IntegrationCardProps) {
  const Icon = icons[integration.provider] || PlugZap;

  return (
    <div className="card flex flex-col gap-5 rounded-[24px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-gold)] bg-[rgba(217,119,6,0.08)] text-[var(--gold)]">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--text)] capitalize">{integration.provider}</h3>
            <p className="mt-1 max-w-xs text-sm leading-6 text-[var(--text-muted)]">{description}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
            integration.connected
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-muted)]"
          }`}
        >
          {integration.connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
          {integration.connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="grid gap-3 rounded-[18px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[var(--text-muted)] md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Last sync</p>
          <p className="mt-2 text-sm text-[var(--text)]">{formatDate(integration.last_synced)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Connection ID</p>
          <p className="mt-2 truncate text-sm text-[var(--text)]">{integration.nango_connection_id || "Pending"}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onConnect(integration.provider)}
        disabled={busy}
        className="btn-primary justify-center disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Opening Nango..." : integration.connected ? "Reconnect" : "Connect"}
      </button>
    </div>
  );
}
