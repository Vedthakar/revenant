"use client";

import { useCallback, useEffect, useState } from "react";

import IntegrationCard from "@/components/IntegrationCard";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { IntegrationStatusItem, NangoSessionResponse } from "@/types/symbiote";

const integrationCopy: Record<string, string> = {
  github: "Commits, pull requests, reviews, and issue activity feed the scoring pipeline today.",
  discord: "Connection status is stored now so Discord activity can join the evaluation pipeline next.",
};

export default function IntegrationsPage() {
  const { user, loading } = useAuthGuard();
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const connectIntegration = async (provider: string) => {
    setBusyProvider(provider);
    setError(null);

    try {
      const { token: sessionToken } = await apiFetch<NangoSessionResponse>("/api/integrations/nango-session", {
        method: "POST",
      });

      const { default: Nango } = await import("@nangohq/frontend");
      const nango = new Nango();

      nango.openConnectUI({
        sessionToken,
        onEvent: async (event) => {
          if (event.type === "connect") {
            const payload = event.payload as {
              connectionId?: string;
              connection_id?: string;
              providerConfigKey?: string;
              provider?: string;
            };
            const resolvedProvider = String(
              payload.providerConfigKey || payload.provider || provider,
            );
            const connectionId = String(
              payload.connectionId || payload.connection_id || "",
            );
            if (connectionId) {
              await apiFetch<IntegrationStatusItem>("/api/integrations/connected", {
                method: "POST",
                json: {
                  provider: resolvedProvider,
                  connection_id: connectionId,
                },
              });
              await loadIntegrations();
            }
            setBusyProvider(null);
          }

          if (event.type === "close") {
            setBusyProvider(null);
          }
        },
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to open Nango Connect");
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
              GitHub and Discord connections are managed through Nango so the FastAPI brain can pull normalized activity without custom OAuth maintenance.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--border-gold)] bg-[rgba(217,119,6,0.08)] px-5 py-4 text-sm leading-7 text-[var(--text)] md:max-w-sm">
            Your data helps you improve. We track work patterns, never private messages.
          </div>
        </div>

        {error ? <p className="mt-8 rounded-[20px] border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</p> : null}

        <section className="mt-10 grid gap-6 xl:grid-cols-2">
          {(fetching || loading) && integrations.length === 0 ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="glass h-[290px] animate-pulse rounded-[28px]" />
            ))
          ) : (
            integrations.map((integration) => (
              <IntegrationCard
                key={integration.provider}
                integration={integration}
                description={integrationCopy[integration.provider] || "Connect this provider through Nango."}
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
