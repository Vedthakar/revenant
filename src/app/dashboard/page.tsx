"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Github,
  MessageSquare,
  Brain,
  Zap,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { getAccessToken, clearAccessToken, AUTH_ENGINEER_KEY } from "@/lib/api";
import type { EngineerSummary } from "@/types/symbiote";

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease },
  }),
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<EngineerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_ENGINEER_KEY)
        : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setLoading(false);
      } catch {
        clearAccessToken();
        router.replace("/login");
      }
    } else {
      clearAccessToken();
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    clearAccessToken();
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div
        className="rev-page"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: "2px solid #ffb25d",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const namespaces = [
    {
      name: "Semantic",
      label: "Architecture & Decisions",
      count: 8,
      color: "#c084fc",
      strength: 94,
    },
    {
      name: "Episodic",
      label: "Stories & Moments",
      count: 6,
      color: "#86efac",
      strength: 88,
    },
    {
      name: "Procedural",
      label: "Frameworks & Playbooks",
      count: 6,
      color: "#fbbf24",
      strength: 91,
    },
  ];

  const activityFeed = [
    {
      time: "14:23",
      event: "GitHub PR #127 indexed",
      detail: "Auth retry logic discussion captured",
      type: "ingest",
    },
    {
      time: "14:18",
      event: "Memory reinforced",
      detail: "Microservices migration decision — strength +12%",
      type: "reinforce",
    },
    {
      time: "13:55",
      event: "Slack thread processed",
      detail: "#platform-ops: deployment rollback discussion",
      type: "ingest",
    },
    {
      time: "13:42",
      event: "Founder session completed",
      detail: "3 memories retrieved, 1 reinforced",
      type: "session",
    },
    {
      time: "13:30",
      event: "Episodic memory stored",
      detail: "New story: iframe permissions debugging incident",
      type: "store",
    },
    {
      time: "12:15",
      event: "Procedural memory promoted",
      detail: "Build vs buy framework — promoted to company memory",
      type: "promote",
    },
    {
      time: "11:48",
      event: "GitHub webhook received",
      detail: "trellis-eng/api-gateway: 4 new commits",
      type: "ingest",
    },
    {
      time: "11:30",
      event: "Decay cycle complete",
      detail: "20 memories evaluated, 2 below threshold",
      type: "decay",
    },
  ];

  const typeColor = (t: string) =>
    t === "reinforce"
      ? "#ffb25d"
      : t === "promote"
        ? "#c084fc"
        : t === "session"
          ? "#86efac"
          : t === "decay"
            ? "#fbbf24"
            : "rgba(255,255,255,0.3)";

  const typeBorder = (t: string) =>
    t === "reinforce"
      ? "rgba(255,178,93,0.2)"
      : t === "promote"
        ? "rgba(192,132,252,0.2)"
        : t === "session"
          ? "rgba(134,239,172,0.2)"
          : t === "decay"
            ? "rgba(251,191,36,0.2)"
            : "rgba(255,255,255,0.06)";

  const typeBg = (t: string) =>
    t === "reinforce"
      ? "rgba(255,178,93,0.06)"
      : t === "promote"
        ? "rgba(192,132,252,0.06)"
        : t === "session"
          ? "rgba(134,239,172,0.06)"
          : t === "decay"
            ? "rgba(251,191,36,0.06)"
            : "rgba(255,255,255,0.02)";

  return (
    <div
      className="rev-page"
      style={{ minHeight: "100vh", color: "white", position: "relative" }}
    >
      <div
        className="rev-noise"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      {/* Nav */}
      <header className="fixed top-0 left-0 z-50 flex w-full items-center border-b border-black/10 bg-white p-2 text-black md:top-4 md:left-1/2 md:w-[calc(100%-2rem)] md:max-w-[1240px] md:-translate-x-1/2 md:border md:px-2 md:py-[8px]">
        <nav className="flex w-full items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-2 font-ui-mono text-sm tracking-[-0.28px]"
          >
            <span className="flex size-6 items-center justify-center bg-black text-white">
              <BrainCircuit size={14} />
            </span>
            <span className="font-medium uppercase">REVENANT</span>
          </Link>
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/dashboard"
              className="px-2 font-ui-mono text-sm tracking-[-0.28px] text-black"
            >
              DASHBOARD
            </Link>
            <Link
              href="/integrations"
              className="px-2 font-ui-mono text-sm tracking-[-0.28px] text-black/60 transition-colors hover:text-black"
            >
              INTEGRATIONS
            </Link>
            <Link
              href="/app"
              className="px-2 font-ui-mono text-sm tracking-[-0.28px] text-black/60 transition-colors hover:text-black"
            >
              FOUNDER CONSOLE
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-ui-mono text-xs tracking-[-0.28px] text-black/40 md:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-2 py-1.5 font-ui-mono text-sm tracking-[-0.28px] text-black/60 transition-colors hover:text-black"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              LOG OUT
            </button>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-[1240px] px-4 pt-[120px] pb-20 lg:px-0">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="flex flex-col gap-6 px-2"
        >
          <div className="flex items-center gap-2">
            <div className="size-[5.82px] bg-white" />
            <span className="font-ui-mono text-sm tracking-[-0.28px] text-white/50">
              OPERATOR DASHBOARD
            </span>
          </div>
          <h1 className="font-display text-4xl leading-[1.15] text-white md:text-5xl lg:text-[64px] lg:leading-[0.87]">
            Welcome back, {user.full_name}.
          </h1>
          <p className="max-w-[600px] text-base leading-[1.4] text-white/50">
            Your memory pipeline is active. Connected sources are syncing
            engineering context into the founder knowledge base.
          </p>

          <div className="mt-2">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-white px-4 py-2.5 font-ui-mono text-sm tracking-[-0.28px] text-black transition-colors hover:bg-white/90"
            >
              OPEN FOUNDER CONSOLE
              <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Integration cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.15}
          variants={reveal}
          className="mt-12 grid gap-px border border-white/[0.08] bg-white/[0.08] md:grid-cols-2 lg:grid-cols-4"
        >
          {/* GitHub */}
          <div className="bg-[#0f0f0f] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center border border-white/[0.08] bg-white/[0.04]">
                  <Github size={18} className="text-white/60" />
                </div>
                <div>
                  <p className="font-ui-mono text-sm text-white">GitHub</p>
                  <p className="font-ui-mono text-[11px] tracking-[-0.28px] text-white/30">
                    trellis-eng
                  </p>
                </div>
              </div>
              <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-ui-mono text-[10px] tracking-[-0.28px] text-emerald-400">
                CONNECTED
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <span className="font-ui-mono text-[11px] text-white/30">
                Last sync
              </span>
              <span className="font-ui-mono text-[11px] text-white/50">
                2 hours ago
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-ui-mono text-[11px] text-white/30">
                Events indexed
              </span>
              <span className="font-ui-mono text-[11px] text-[#ffb25d]">
                847
              </span>
            </div>
          </div>

          {/* Slack */}
          <div className="bg-[#0f0f0f] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center border border-white/[0.08] bg-white/[0.04]">
                  <MessageSquare size={18} className="text-white/60" />
                </div>
                <div>
                  <p className="font-ui-mono text-sm text-white">Slack</p>
                  <p className="font-ui-mono text-[11px] tracking-[-0.28px] text-white/30">
                    trellis-workspace
                  </p>
                </div>
              </div>
              <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-ui-mono text-[10px] tracking-[-0.28px] text-emerald-400">
                CONNECTED
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <span className="font-ui-mono text-[11px] text-white/30">
                Last sync
              </span>
              <span className="font-ui-mono text-[11px] text-white/50">
                34 min ago
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-ui-mono text-[11px] text-white/30">
                Messages processed
              </span>
              <span className="font-ui-mono text-[11px] text-[#ffb25d]">
                1,203
              </span>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-[#0f0f0f] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center border border-white/[0.08] bg-white/[0.04]">
                  <Brain size={18} className="text-white/60" />
                </div>
                <div>
                  <p className="font-ui-mono text-sm text-white">Memory</p>
                  <p className="font-ui-mono text-[11px] tracking-[-0.28px] text-white/30">
                    moorcheh pipeline
                  </p>
                </div>
              </div>
              <span className="border border-[#ffb25d]/30 bg-[#ffb25d]/10 px-2 py-1 font-ui-mono text-[10px] tracking-[-0.28px] text-[#ffb25d]">
                ACTIVE
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <span className="font-ui-mono text-[11px] text-white/30">
                Memories stored
              </span>
              <span className="font-ui-mono text-[11px] text-white/50">
                20
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-ui-mono text-[11px] text-white/30">
                Namespaces
              </span>
              <span className="font-ui-mono text-[11px] text-[#ffb25d]">
                3 active
              </span>
            </div>
          </div>

          {/* Tavus */}
          <div className="bg-[#0f0f0f] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center border border-white/[0.08] bg-white/[0.04]">
                  <Zap size={18} className="text-white/60" />
                </div>
                <div>
                  <p className="font-ui-mono text-sm text-white">Tavus</p>
                  <p className="font-ui-mono text-[11px] tracking-[-0.28px] text-white/30">
                    avatar endpoint
                  </p>
                </div>
              </div>
              <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-ui-mono text-[10px] tracking-[-0.28px] text-emerald-400">
                READY
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <span className="font-ui-mono text-[11px] text-white/30">
                Persona
              </span>
              <span className="font-ui-mono text-[11px] text-white/50">
                Founder Mentor
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-ui-mono text-[11px] text-white/30">
                Sessions today
              </span>
              <span className="font-ui-mono text-[11px] text-[#ffb25d]">
                3
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bottom grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={reveal}
          className="mt-px grid gap-px border border-white/[0.08] bg-white/[0.08] lg:grid-cols-2"
        >
          {/* Namespace breakdown */}
          <div className="bg-[#0f0f0f] p-6">
            <p className="font-ui-mono text-xs tracking-[-0.28px] text-white/40">
              COGNITIVE MODEL
            </p>
            <h3 className="mt-3 text-xl leading-[1.2] text-white">
              Memory Namespaces
            </h3>
            <p className="mt-2 text-sm leading-[1.4] text-white/40">
              Three-tier founder memory architecture with Ebbinghaus decay.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {namespaces.map((ns) => (
                <div
                  key={ns.name}
                  className="border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-2"
                        style={{ background: ns.color }}
                      />
                      <span className="font-ui-mono text-sm text-white">
                        {ns.name}
                      </span>
                    </div>
                    <span
                      className="font-ui-mono text-[11px]"
                      style={{ color: ns.color }}
                    >
                      {ns.count} memories
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-ui-mono text-[10px] text-white/30">
                      {ns.label}
                    </span>
                    <span className="font-ui-mono text-[10px] text-white/40">
                      Avg strength: {ns.strength}%
                    </span>
                  </div>
                  <div className="mt-3 h-1 w-full bg-white/[0.06]">
                    <div
                      className="h-full"
                      style={{
                        width: `${ns.strength}%`,
                        background: ns.color,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-[#0f0f0f] p-6">
            <p className="font-ui-mono text-xs tracking-[-0.28px] text-white/40">
              ACTIVITY
            </p>
            <h3 className="mt-3 text-xl leading-[1.2] text-white">
              Recent Pipeline Events
            </h3>

            <div className="mt-6 flex flex-col gap-2">
              {activityFeed.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-white/[0.04] pb-2 last:border-0"
                >
                  <span className="w-10 shrink-0 pt-[2px] font-ui-mono text-[10px] text-white/20">
                    {item.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-ui-mono text-[11px] text-white/70">
                      {item.event}
                    </p>
                    <p className="truncate font-ui-mono text-[10px] text-white/30">
                      {item.detail}
                    </p>
                  </div>
                  <span
                    className="shrink-0 border px-1.5 py-0.5 font-ui-mono text-[9px] tracking-[-0.28px]"
                    style={{
                      color: typeColor(item.type),
                      borderColor: typeBorder(item.type),
                      background: typeBg(item.type),
                    }}
                  >
                    {item.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
