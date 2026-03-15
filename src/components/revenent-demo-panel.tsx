"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Circle,
  CircleCheck,
  Database,
  GitPullRequestArrow,
  MessageSquareShare,
  RotateCcw,
  Search,
  type LucideIcon,
} from "lucide-react";

type DemoPanelKey = "capture" | "connections" | "sandbox" | "execute";
type DemoMessageId = "capture" | "connections" | "sandbox" | "answer" | "execute" | "result";

type DemoTool = {
  icon: LucideIcon;
  name: string;
  description: string;
  badge: string;
};

type DemoConnection = {
  icon: LucideIcon;
  name: string;
  meta: string;
  status: string;
};

type DemoMessage = {
  id: DemoMessageId;
  kind: "tool" | "assistant";
  text: string;
  panel?: DemoPanelKey;
};

type DemoTimelineStep = {
  delay: number;
  items: DemoMessageId[];
  activePanels: DemoPanelKey[];
  thinking?: boolean;
};

type DemoScenario = {
  id: string;
  prompt: string;
  capture: {
    query: string;
    found: string;
    tools: DemoTool[];
    plan: string[];
    warnings: string[];
  };
  connections: DemoConnection[];
  execute: {
    tool: string;
    session: string;
    rows: Array<[string, string]>;
    status: string;
  };
  agent: {
    agent: string;
    provider: string;
    model: string;
  };
  sandbox: string;
  messages: DemoMessage[];
};

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease },
  }),
};

const demoTimeline: DemoTimelineStep[] = [
  { delay: 950, items: ["capture"], activePanels: ["capture"] },
  { delay: 650, items: ["capture", "connections"], activePanels: ["connections"] },
  { delay: 2800, items: ["capture", "connections"], activePanels: ["connections"], thinking: true },
  { delay: 3200, items: ["capture", "connections", "sandbox", "answer"], activePanels: ["sandbox"] },
  { delay: 1200, items: ["capture", "connections", "sandbox", "answer", "execute"], activePanels: ["execute"] },
  { delay: 1600, items: ["capture", "connections", "sandbox", "answer", "execute"], activePanels: ["execute"], thinking: true },
  {
    delay: 2400,
    items: ["capture", "connections", "sandbox", "answer", "execute", "result"],
    activePanels: ["execute"],
  },
];

const demoScenarios: DemoScenario[] = [
  {
    id: "auth-retries",
    prompt: "Why did the team keep auth retry logic inside deploy sequencing instead of moving it into the worker queue?",
    capture: {
      query: "find why auth retry stayed in deploy sequencing",
      found: "3 found",
      tools: [
        {
          icon: MessageSquareShare,
          name: "SLACK_INCIDENT_THREADS",
          description: "Pull approval-heavy incident discussion from #auth-war-room",
          badge: "MATCH",
        },
        {
          icon: GitPullRequestArrow,
          name: "GITHUB_PR_REASONING",
          description: "Extract review tradeoffs, rollback notes, and deploy comments",
          badge: "MATCH",
        },
        {
          icon: Database,
          name: "JIRA_ARC_LINKER",
          description: "Attach ARC-219 ownership and follow-up remediation context",
          badge: "MATCH",
        },
      ],
      plan: [
        "Find incident and review threads",
        "Batch rationale into one memory packet",
        "Promote source-grounded answer",
      ],
      warnings: ["! missing postmortem link", "! stale owner on ARC-219"],
    },
    connections: [
      { icon: MessageSquareShare, name: "Slack", meta: "OAuth 2.0", status: "Connected" },
      { icon: GitPullRequestArrow, name: "GitHub", meta: "GitHub App", status: "Connected" },
      { icon: Database, name: "Jira", meta: "OAuth 2.0", status: "Connected" },
    ],
    execute: {
      tool: "REVENENT_PROMOTE_MEMORY",
      session: "sx-auth9",
      rows: [
        ["memory", "Auth deploy retry decision"],
        ["evidence", "3 linked sources"],
      ],
      status: "200 OK - memory promoted",
    },
    agent: {
      agent: "Revenent Mentor",
      provider: "OpenAI",
      model: "gpt-5",
    },
    sandbox: "memory graph - source-grounded recall",
    messages: [
      { id: "capture", kind: "tool", text: "REVENENT_CAPTURE_PIPELINE", panel: "capture" },
      { id: "connections", kind: "tool", text: "REVENENT_MANAGE_CONNECTIONS", panel: "connections" },
      { id: "sandbox", kind: "tool", text: "REVENENT_SANDBOX", panel: "sandbox" },
      {
        id: "answer",
        kind: "assistant",
        text: "Revenent found the decision in GitHub review threads, a Slack incident channel, and the Jira follow-up. The team kept sequencing coupled because queue lag caused token expiry during blue-green deploys.",
      },
      { id: "execute", kind: "tool", text: "REVENENT_EXECUTE_MEMORY", panel: "execute" },
      {
        id: "result",
        kind: "assistant",
        text: "All done. The memory packet was promoted with linked evidence and is now queryable by the mentor.",
      },
    ],
  },
  {
    id: "billing-retries",
    prompt: "Why did billing stop retrying failed renewals immediately after the duplicate-charge incident?",
    capture: {
      query: "trace duplicate-charge incident and billing retry change",
      found: "4 found",
      tools: [
        {
          icon: MessageSquareShare,
          name: "SLACK_BILLING_SUMMARY",
          description: "Collect incident updates, approvals, and finance handoff notes",
          badge: "MATCH",
        },
        {
          icon: Database,
          name: "INCIDENT_DB_LINKER",
          description: "Tie the incident issue, remediation tasks, and owners together",
          badge: "MATCH",
        },
        {
          icon: GitPullRequestArrow,
          name: "GITHUB_POLICY_DIFF",
          description: "Pull the retry policy diff and the rollout commentary",
          badge: "MATCH",
        },
      ],
      plan: [
        "Find incident timeline and rollback notes",
        "Cross-check policy diff with approvals",
        "Promote billing retry rationale",
      ],
      warnings: ["! finance sign-off in thread only", "! vendor note missing ticket link"],
    },
    connections: [
      { icon: MessageSquareShare, name: "Slack", meta: "OAuth 2.0", status: "Connected" },
      { icon: Database, name: "Incident DB", meta: "API key", status: "Connected" },
      { icon: GitPullRequestArrow, name: "GitHub", meta: "GitHub App", status: "Connected" },
    ],
    execute: {
      tool: "REVENENT_PROMOTE_MEMORY",
      session: "sx-bill4",
      rows: [
        ["memory", "Billing retry safety change"],
        ["evidence", "4 linked sources"],
      ],
      status: "200 OK - memory promoted",
    },
    agent: {
      agent: "Revenent Mentor",
      provider: "OpenAI",
      model: "gpt-5",
    },
    sandbox: "memory graph - incident reconstruction",
    messages: [
      { id: "capture", kind: "tool", text: "REVENENT_CAPTURE_PIPELINE", panel: "capture" },
      { id: "connections", kind: "tool", text: "REVENENT_MANAGE_CONNECTIONS", panel: "connections" },
      { id: "sandbox", kind: "tool", text: "REVENENT_SANDBOX", panel: "sandbox" },
      {
        id: "answer",
        kind: "assistant",
        text: "The team disabled immediate retries after finding they could replay against stale payment intents. Finance approved a slower retry window until idempotency checks shipped.",
      },
      { id: "execute", kind: "tool", text: "REVENENT_EXECUTE_MEMORY", panel: "execute" },
      {
        id: "result",
        kind: "assistant",
        text: "The billing memory packet is promoted with incident evidence, rollout notes, and the finance approval thread attached.",
      },
    ],
  },
  {
    id: "search-shards",
    prompt: "Why was the search shard split postponed even after the migration plan was approved?",
    capture: {
      query: "find why search shard split was postponed",
      found: "5 found",
      tools: [
        {
          icon: GitPullRequestArrow,
          name: "GITHUB_MIGRATION_REVIEW",
          description: "Pull migration comments, rollback criteria, and perf concerns",
          badge: "MATCH",
        },
        {
          icon: Database,
          name: "JIRA_CAPACITY_LINKER",
          description: "Link ARC-312, capacity notes, and migration blockers",
          badge: "MATCH",
        },
        {
          icon: MessageSquareShare,
          name: "CHAT_RELEASE_THREAD",
          description: "Collect release-channel debate and final approval language",
          badge: "MATCH",
        },
      ],
      plan: [
        "Find migration approval and blocker threads",
        "Reconstruct the capacity tradeoff",
        "Promote postponement rationale",
      ],
      warnings: ["! stale storage estimate", "! runbook update still pending"],
    },
    connections: [
      { icon: GitPullRequestArrow, name: "GitHub", meta: "GitHub App", status: "Connected" },
      { icon: Database, name: "Jira", meta: "OAuth 2.0", status: "Connected" },
      { icon: MessageSquareShare, name: "Release Chat", meta: "OAuth 2.0", status: "Connected" },
    ],
    execute: {
      tool: "REVENENT_PROMOTE_MEMORY",
      session: "sx-srch2",
      rows: [
        ["memory", "Search shard split postponement"],
        ["evidence", "5 linked sources"],
      ],
      status: "200 OK - memory promoted",
    },
    agent: {
      agent: "Revenent Mentor",
      provider: "OpenAI",
      model: "gpt-5",
    },
    sandbox: "memory graph - architecture recall",
    messages: [
      { id: "capture", kind: "tool", text: "REVENENT_CAPTURE_PIPELINE", panel: "capture" },
      { id: "connections", kind: "tool", text: "REVENENT_MANAGE_CONNECTIONS", panel: "connections" },
      { id: "sandbox", kind: "tool", text: "REVENENT_SANDBOX", panel: "sandbox" },
      {
        id: "answer",
        kind: "assistant",
        text: "Revenent found that the plan was approved conditionally, but storage growth outpaced the original estimate. The split was delayed until the new rollback window and runbook were in place.",
      },
      { id: "execute", kind: "tool", text: "REVENENT_EXECUTE_MEMORY", panel: "execute" },
      {
        id: "result",
        kind: "assistant",
        text: "The architecture memory is now promoted with the approval thread, blocker ticket, and release-channel decision attached.",
      },
    ],
  },
];

function mergeUniquePanels(current: DemoPanelKey[], next: DemoPanelKey[]) {
  return Array.from(new Set([...current, ...next]));
}

function getPanelClass(active: boolean, completed: boolean) {
  if (active) {
    return "border-white/[0.16] bg-white/[0.07] opacity-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]";
  }

  if (completed) {
    return "border-white/[0.1] bg-white/[0.04] opacity-95";
  }

  return "border-white/[0.08] bg-[#141414]/50 opacity-70";
}

export function RevenentDemoPanel() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isInView, setIsInView] = useState(false);
  const [activePanels, setActivePanels] = useState<DemoPanelKey[]>([]);
  const [showReplay, setShowReplay] = useState(false);
  const scenario = demoScenarios[scenarioIndex];
  const visibleItemIds: DemoMessageId[] = stepIndex >= 0 ? demoTimeline[stepIndex].items : [];
  const visibleMessages = scenario.messages.filter((message) => visibleItemIds.includes(message.id));
  const completedPanels = demoTimeline
    .slice(0, Math.max(stepIndex, 0))
    .reduce<DemoPanelKey[]>((current, step) => mergeUniquePanels(current, step.activePanels), []);
  const thinking = stepIndex >= 0 ? Boolean(demoTimeline[stepIndex].thinking) && !showReplay : false;

  useEffect(() => {
    const node = sectionRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || stepIndex !== -1) {
      return;
    }

    const starter = window.setTimeout(() => {
      setStepIndex(0);
    }, scenarioIndex === 0 ? 250 : 650);

    return () => window.clearTimeout(starter);
  }, [isInView, scenarioIndex, stepIndex]);

  useEffect(() => {
    if (!isInView || stepIndex < 0) {
      return;
    }

    const step = demoTimeline[stepIndex];
    let highlightTimer: number | undefined;
    let cycleTimer: number | undefined;

    if (step.activePanels.length > 0) {
      highlightTimer = window.setTimeout(() => {
        setActivePanels(step.activePanels);
      }, 600);
    }

    const advanceTimer = window.setTimeout(() => {
      setActivePanels([]);

      if (stepIndex === demoTimeline.length - 1) {
        setShowReplay(true);
        cycleTimer = window.setTimeout(() => {
          setActivePanels([]);
          setShowReplay(false);
          setScenarioIndex((current) => (current + 1) % demoScenarios.length);
          setStepIndex(-1);
        }, 1400);
        return;
      }

      setStepIndex((current) => current + 1);
    }, step.delay);

    return () => {
      if (highlightTimer) {
        window.clearTimeout(highlightTimer);
      }

      window.clearTimeout(advanceTimer);

      if (cycleTimer) {
        window.clearTimeout(cycleTimer);
      }
    };
  }, [isInView, stepIndex]);

  function restartScenario() {
    setActivePanels([]);
    setShowReplay(false);
    setStepIndex(-1);
  }

  function panelState(key: DemoPanelKey) {
    return {
      active: activePanels.includes(key),
      completed: completedPanels.includes(key),
    };
  }

  const capturePanel = panelState("capture");
  const connectionsPanel = panelState("connections");
  const executePanel = panelState("execute");

  return (
    <div ref={sectionRef} className="border-t border-white/8 pt-10">
      <div className="space-y-6 lg:hidden">
        <div className="space-y-6">
          <motion.div
            custom={0.28}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className={`border p-4 ${getPanelClass(connectionsPanel.active, connectionsPanel.completed)}`}
          >
            <div className="font-ui-mono text-[11px] uppercase tracking-[0.16em] text-white/22">
              REVENENT_MANAGE_CONNECTIONS
            </div>
            <div className="mt-4 font-ui-mono text-[11px] uppercase tracking-[0.08em] text-white/18">
              workspace_id: ws_9x2klm7
            </div>
            <div className="mt-5 space-y-2">
              {scenario.connections.map((connection) => {
                const Icon = connection.icon;

                return (
                  <div key={connection.name} className="flex items-center justify-between border border-white/6 bg-[#121214] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon size={15} className="text-[#f2b25c]" />
                      <div>
                        <div className="text-[15px] leading-none text-white/42">{connection.name}</div>
                        <div className="mt-1 text-[11px] text-white/18">{connection.meta}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-ui-mono text-[11px] uppercase tracking-[0.08em] text-[#1fc47f]">
                      <Circle size={8} fill="currentColor" />
                      {connection.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            custom={0.34}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className={`border p-4 ${getPanelClass(executePanel.active, executePanel.completed)}`}
          >
            <div className="flex items-center justify-between font-ui-mono text-[11px] uppercase tracking-[0.16em] text-white/22">
              <span>REVENENT_EXECUTE_MEMORY</span>
              <span>session: {scenario.execute.session}</span>
            </div>
            <div className="mt-4 border border-white/6 bg-[#121214] px-4 py-3 font-ui-mono text-[11px] uppercase tracking-[0.08em] text-white/18">
              {scenario.execute.tool}
            </div>
            <div className="mt-2 border border-white/6 bg-[#121214] px-4 py-3 text-sm text-white/18">
              {scenario.execute.rows.map(([label, value], index) => (
                <div key={label} className={index === 0 ? "flex justify-between" : "mt-1 flex justify-between"}>
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 font-ui-mono text-[11px] uppercase tracking-[0.08em] text-white/22">
              <CircleCheck size={12} className="text-white/28" />
              {scenario.execute.status}
            </div>
          </motion.div>

          <motion.div
            custom={0.4}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className="border border-white/8 bg-[#0f0f10] p-4"
          >
            <div className="font-ui-mono text-[11px] uppercase tracking-[0.16em] text-white/22">
              AGENT_CONFIG
            </div>
            <div className="mt-4 space-y-3 font-ui-mono text-[11px] uppercase tracking-[0.08em] text-white/18">
              {[
                ["Agent", scenario.agent.agent],
                ["Provider", scenario.agent.provider],
                ["Model", scenario.agent.model],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-white/6 pb-3 last:border-b-0 last:pb-0">
                  <span>{label}</span>
                  <span className="text-white/42">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          custom={0.46}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mx-auto border border-white/10 bg-[#0f0f10] px-5 py-4"
        >
          <div className="flex items-center justify-between font-ui-mono text-[11px] uppercase tracking-[0.14em] text-white/24">
            <span>REVENENT_SANDBOX</span>
            <span>{scenario.sandbox}</span>
          </div>
        </motion.div>
      </div>

      <div
        className="mx-auto mt-10 hidden w-full max-w-[1240px] border-t border-white/[0.08] pt-8 lg:grid"
        style={{ gridTemplateColumns: "27.4% 35.5% 27.4%", columnGap: "4.85%" }}
      >
        <div className="flex flex-col gap-8">
          <motion.div
            custom={0.16}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className={`border p-4 ${getPanelClass(capturePanel.active, capturePanel.completed)}`}
          >
            <div className="font-ui-mono text-[11px] uppercase tracking-[0.16em] text-white/22">
              REVENENT_CAPTURE_PIPELINE
            </div>
            <div className="mt-4 flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 font-ui-mono text-[11px] text-white/22">
              <Search size={12} />
              <span>{scenario.capture.query}</span>
              <span className="ml-auto text-white/18">{scenario.capture.found}</span>
            </div>

            <div className="mt-4 space-y-2">
              {scenario.capture.tools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <div key={tool.name} className="border border-white/[0.06] bg-[#121214] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Icon size={14} className="text-[#f2b25c]" />
                      <div className="min-w-0 flex-1">
                        <div className="font-ui-mono text-[11px] uppercase tracking-[0.08em] text-white/36">
                          {tool.name}
                        </div>
                        <div className="mt-1 text-[11px] leading-5 text-white/18">{tool.description}</div>
                      </div>
                      <span className="border border-[#173e72] bg-[#10213a] px-1.5 py-1 font-ui-mono text-[10px] uppercase tracking-[0.12em] text-[#6aa7ff]">
                        {tool.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-[1fr_0.8fr] gap-6 font-ui-mono text-[11px] uppercase tracking-[0.08em]">
              <div>
                <div className="text-white/26">PLAN</div>
                <div className="mt-2 space-y-1 text-white/22">
                  {scenario.capture.plan.map((step, index) => (
                    <div key={step}>
                      {index + 1} {step}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[#d79a4e]">WARNINGS</div>
                <div className="mt-2 space-y-1 text-[#8f7a58]">
                  {scenario.capture.warnings.map((warning) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            custom={0.2}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className="flex flex-col border border-white/[0.08] bg-[#141414]/50 p-4 font-ui-mono text-xs"
          >
            <h2 className="mb-4 text-sm uppercase tracking-wider text-white/60">Watch Revenent In Action</h2>
            <button
              type="button"
              className="flex w-fit items-center justify-center bg-white px-3 py-1.5 text-xs tracking-[-0.28px] text-black transition-colors hover:bg-white/90"
            >
              OPEN MENTOR
            </button>
          </motion.div>
        </div>

        <motion.div
          custom={0.22}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mt-4 flex h-[500px] flex-col overflow-hidden border border-white/[0.08] bg-[#1a1a1a] shadow-2xl"
          style={{ borderRadius: 28 }}
        >
          <div className="flex items-center justify-center gap-2 px-5 py-3">
            <BrainCircuit size={16} className="text-white/80" />
            <span className="text-[13px] font-medium text-white/85">Revenent Mentor</span>
          </div>
          <div className="flex h-[380px] flex-col gap-4 overflow-hidden px-5 pt-5 pb-3">
            <div className="flex justify-end opacity-35">
              <div className="max-w-[85%] rounded-[24px] bg-[#232323] px-4 py-2.5 text-[14px] leading-relaxed text-white/70">
                {scenario.prompt}
              </div>
            </div>

            <AnimatePresence initial={false} mode="popLayout">
              {visibleMessages.map((item) =>
                item.kind === "tool" ? (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease }}
                    className={`inline-flex items-center gap-1 text-[12px] leading-none tracking-wide ${
                      item.panel && activePanels.includes(item.panel) ? "text-white/40" : "text-white/28"
                    }`}
                  >
                    <span className="font-medium uppercase">{item.text}</span>
                    <ChevronRight size={12} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.32, ease }}
                    className={`text-[15px] leading-relaxed ${item.id === "result" ? "text-white/90" : "text-white/78"}`}
                  >
                    {item.text}
                  </motion.div>
                ),
              )}
            </AnimatePresence>

            {thinking ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-auto flex items-center gap-2 font-ui-mono text-[11px] uppercase tracking-[0.08em] text-white/18"
              >
                <span>Tracing source evidence</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((index) => (
                    <motion.span
                      key={index}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.15, repeat: Number.POSITIVE_INFINITY, delay: index * 0.16 }}
                      className="size-1.5 rounded-full bg-[#c9a06b]"
                    />
                  ))}
                </div>
              </motion.div>
            ) : null}
          </div>

          <div className="px-3 pb-3">
            <div className="flex flex-col gap-2 rounded-[24px] bg-[#2b2b2b] px-4 pt-3 pb-2.5">
              <span className="text-[14px] text-white/35">Reply...</span>
              <div className="flex items-center justify-between">
                <span className="text-[34px] leading-none text-white/35">+</span>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center text-[12px] leading-none text-white/35">{scenario.agent.model}</span>
                  {showReplay ? (
                    <button
                      type="button"
                      onClick={restartScenario}
                      className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition-colors hover:bg-white/[0.08]"
                      aria-label="Replay scenario"
                    >
                      <RotateCcw size={13} />
                    </button>
                  ) : (
                    <button type="button" className="flex size-8 items-center justify-center rounded-full bg-[#c9a06b] text-black">
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div
            custom={0.28}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className={`flex flex-col border p-4 font-ui-mono text-xs ${getPanelClass(
              connectionsPanel.active,
              connectionsPanel.completed,
            )}`}
          >
            <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">REVENENT_MANAGE_CONNECTIONS</div>
            <div className="mb-5 text-[11px] uppercase tracking-wider text-white/30">WORKSPACE_ID: ws_9x2klm7</div>
            <div className="flex flex-col gap-2">
              {scenario.connections.map((connection) => {
                const Icon = connection.icon;

                return (
                  <div key={connection.name} className="flex items-center justify-between border border-white/[0.08] bg-white/[0.03] px-2.5 py-3">
                    <div className="flex items-center gap-3">
                      <Icon size={14} className="text-[#f2b25c]" />
                      <div>
                        <div className="text-[11px] text-white/65">{connection.name}</div>
                        <div className="text-[10px] text-white/30">{connection.meta}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#00c26e]">
                      <Circle size={8} fill="currentColor" />
                      <span>{connection.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            custom={0.34}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className={`flex flex-col border p-4 font-ui-mono text-xs ${getPanelClass(
              executePanel.active,
              executePanel.completed,
            )}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/40">REVENENT_EXECUTE_MEMORY</span>
              <span className="text-[10px] text-white/25">SESSION: {scenario.execute.session}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border border-white/[0.08] bg-white/[0.03] px-2.5 py-2">
                <Database size={14} className="text-[#f2b25c]" />
                <span className="text-[11px] leading-tight text-white/50">{scenario.execute.tool}</span>
              </div>
              <div className="flex flex-col gap-1 border border-white/[0.06] px-2.5 py-2">
                {scenario.execute.rows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-[10px]">
                    <span className="text-white/25">{label}</span>
                    <span className="text-white/40">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#00c26e]">
                <CircleCheck size={12} />
                <span>{scenario.execute.status}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            custom={0.4}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className="flex flex-col border border-white/[0.08] bg-[#141414]/50 p-4 font-ui-mono text-xs opacity-70"
          >
            <div className="mb-3">
              <span className="text-[11px] uppercase tracking-wider text-white/40">AGENT_CONFIG</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["AGENT", scenario.agent.agent],
                ["PROVIDER", scenario.agent.provider],
                ["MODEL", scenario.agent.model],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-white/[0.06] pb-2 last:border-0 last:pb-0">
                  <span className="text-[11px] text-white/30">{label}</span>
                  <span className="text-[12px] text-white/70">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        custom={0.46}
        initial="hidden"
        animate="visible"
        variants={reveal}
        className="mx-auto hidden w-full max-w-[1240px] border-b border-white/[0.08] px-[6.4%] pb-16 lg:block"
      >
        <div className="overflow-hidden border border-white/[0.08] bg-[#141414]/50 p-4 font-ui-mono text-xs">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-white/30">REVENENT_SANDBOX</div>
            <div className="flex items-center gap-1.5 text-[9px] text-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
              {scenario.sandbox}
            </div>
          </div>
          <div className="h-[110px] border border-white/[0.08] bg-[#111]" />
        </div>
      </motion.div>
    </div>
  );
}
