"use client";

import { useCallback, useEffect, useState } from "react";

import IntegrationCard from "@/components/IntegrationCard";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { AuthUrlResponse, IntegrationStatusItem } from "@/types/symbiote";

const integrationCopy: Record<string, string> = {
  github: "Commits, pull requests, and repository updates stream into the scorer through real-time webhooks.",
  discord: "Discord messages can be pushed into the evaluator in real time without polling.",
  slack: "Slack messages arrive through Unified.to and active teammates are hydrated as events come in.",
};

export default function IntegrationsPage() {
  const { user, loading } = useAuthGuard();
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    setFetching(true);
    try {
      const data = await apiFetch<IntegrationStatusItem[]>("/api/integrations/status");
      setIntegrations(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load integrations");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadIntegrations();
    }
  }, [loadIntegrations, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const authError = params.get("error");
    if (!connected && !authError) {
      return;
    }

    if (connected) {
      const label = connected.charAt(0).toUpperCase() + connected.slice(1);
      setSuccessMessage(`${label} connected through Unified.to.`);
      if (user) {
        void loadIntegrations();
      }
    }

    if (authError) {
      setError(authError === "auth_failed" ? "Unified.to authorization failed." : `Unable to connect integration: ${authError}`);
    }

    params.delete("connected");
    params.delete("error");
    const nextSearch = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`);
  }, [loadIntegrations, user]);

  const connectIntegration = async (provider: string) => {
    setBusyProvider(provider);
    setError(null);
    setSuccessMessage(null);

    try {
      const { auth_url: authUrl } = await apiFetch<AuthUrlResponse>(`/api/integrations/auth-url?provider=${encodeURIComponent(provider)}`, {
        method: "POST",
      });

      window.location.assign(authUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start Unified.to authorization");
      setBusyProvider(null);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="tag tag-gold">Integration control</span>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">Connect the tools that shape your engineering habits.</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              GitHub and messaging connections are authorized through Unified.to so the FastAPI brain can receive normalized events in real time instead of polling a proxy.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--border-gold)] bg-[rgba(217,119,6,0.08)] px-5 py-4 text-sm leading-7 text-[var(--text)] md:max-w-sm">
            Your data helps you improve. We track work patterns, never private messages.
          </div>
        </div>

        {error ? <p className="mt-8 rounded-[20px] border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</p> : null}
        {successMessage ? <p className="mt-8 rounded-[20px] border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">{successMessage}</p> : null}

        <section className="mt-10 grid gap-6 xl:grid-cols-2">
          {(fetching || loading) && integrations.length === 0 ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="glass h-[290px] animate-pulse rounded-[28px]" />
            ))
          ) : (
            integrations.map((integration) => (
              <IntegrationCard
                key={integration.provider}
                integration={integration}
                description={integrationCopy[integration.provider] || "Connect this provider through Unified.to."}
                busy={busyProvider === integration.provider}
                onConnect={connectIntegration}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}
