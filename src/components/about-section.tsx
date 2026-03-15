"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/* ── scramble text reveal ── */
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./:";

  useEffect(() => {
    if (!inView) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration) return text[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      iteration += 0.5;
      if (iteration >= text.length) {
        setDisplay(text);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [inView, text]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/* ── blinking cursor ── */
function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#ea580c] animate-blink" />;
}

/* ── live memory counter ── */
function MemoryCounter() {
  const [count, setCount] = useState(1247);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((s) => s + Math.floor(Math.random() * 2));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-[#ea580c]" style={{ fontVariantNumeric: "tabular-nums" }}>
      {count.toLocaleString()} decisions
    </span>
  );
}

/* ── stat block ── */
const STATS = [
  { label: "DECISIONS_CAPTURED", value: "1,247" },
  { label: "ENGINEERS_ONBOARDED", value: "38" },
  { label: "CONTEXT_ACCURACY", value: "95.3%" },
  { label: "HOURS_SAVED", value: "4,200" },
];

function StatBlock({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.5, ease }}
      className="flex flex-col gap-1 border-2 border-foreground px-4 py-3"
    >
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
        {label}
      </span>
      <span className="text-xl lg:text-2xl font-mono font-bold tracking-tight">
        <ScrambleText text={value} />
      </span>
    </motion.div>
  );
}

/* ── memory network SVG visualization ── */
function MemoryNetworkViz() {
  const nodes = [
    { id: "slack", label: "SLACK", x: 80, y: 60 },
    { id: "github", label: "GITHUB", x: 80, y: 140 },
    { id: "jira", label: "JIRA", x: 80, y: 220 },
    { id: "gmail", label: "GMAIL", x: 80, y: 300 },
    { id: "core", label: "RVN", x: 260, y: 180 },
    { id: "mentor", label: "MENTOR", x: 440, y: 80 },
    { id: "recall", label: "RECALL", x: 440, y: 180 },
    { id: "plan", label: "PLAN", x: 440, y: 280 },
  ];

  const edges = [
    ["slack", "core"],
    ["github", "core"],
    ["jira", "core"],
    ["gmail", "core"],
    ["core", "mentor"],
    ["core", "recall"],
    ["core", "plan"],
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <svg
      viewBox="0 0 560 360"
      className="w-full h-full"
      role="img"
      aria-label="Revenant memory network: integrations feeding into memory core, powering mentor and recall"
    >
      {/* Grid lines */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={`vl-${i}`}
          x1={i * 24}
          y1={0}
          x2={i * 24}
          y2={360}
          stroke="var(--color-border)"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <line
          key={`hl-${i}`}
          x1={0}
          y1={i * 24}
          x2={560}
          y2={i * 24}
          stroke="var(--color-border)"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* Edges */}
      {edges.map(([fromId, toId], i) => {
        const from = getNode(fromId);
        const to = getNode(toId);
        const fw = fromId === "core" ? 72 : 80;
        const fh = 30;
        return (
          <line
            key={`edge-${i}`}
            x1={from.x + fw / 2}
            y1={from.y + fh / 2}
            x2={to.x + (fromId === "core" ? 0 : 72) / 2}
            y2={to.y + fh / 2}
            stroke="var(--color-foreground)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.6}
          />
        );
      })}

      {/* Data packets */}
      {edges.map(([fromId, toId], i) => {
        const from = getNode(fromId);
        const to = getNode(toId);
        const fw = fromId === "core" ? 72 : 80;
        const fh = 30;
        return (
          <circle key={`pkt-${i}`} r={3} fill="#ea580c">
            <animate
              attributeName="cx"
              values={`${from.x + fw / 2};${to.x + 40}`}
              dur={`${1.5 + i * 0.2}s`}
              begin={`${i * 0.3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${from.y + fh / 2};${to.y + fh / 2}`}
              dur={`${1.5 + i * 0.2}s`}
              begin={`${i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}

      {/* Input nodes (Slack, GitHub, Jira, Gmail) */}
      {nodes
        .filter((n) => ["slack", "github", "jira", "gmail"].includes(n.id))
        .map((node) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={80}
              height={30}
              fill="var(--color-foreground)"
              opacity={0.85}
            />
            <text
              x={node.x + 40}
              y={node.y + 19}
              textAnchor="middle"
              fill="var(--color-background)"
              fontSize={9}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={700}
              letterSpacing="0.1em"
            >
              {node.label}
            </text>
          </g>
        ))}

      {/* Core node */}
      {(() => {
        const core = getNode("core");
        return (
          <g>
            <rect
              x={core.x}
              y={core.y - 36}
              width={72}
              height={72}
              fill="var(--color-muted)"
              stroke="#ea580c"
              strokeWidth={2}
            />
            <text
              x={core.x + 36}
              y={core.y + 6}
              textAnchor="middle"
              fill="var(--color-foreground)"
              fontSize={14}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={700}
              letterSpacing="0.1em"
            >
              RVN
            </text>
            <circle cx={core.x + 36} cy={core.y + 20} r={18} fill="none" stroke="#ea580c" strokeWidth={1}>
              <animate
                attributeName="r"
                values="18;22;18"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })()}

      {/* Output nodes (Mentor, Recall, Plan) */}
      {nodes
        .filter((n) => ["mentor", "recall", "plan"].includes(n.id))
        .map((node) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={80}
              height={30}
              fill="none"
              stroke="var(--color-foreground)"
              strokeWidth={1.5}
            />
            <text
              x={node.x + 40}
              y={node.y + 19}
              textAnchor="middle"
              fill="var(--color-foreground)"
              fontSize={9}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={600}
              letterSpacing="0.1em"
            >
              {node.label}
            </text>
            <circle cx={node.x + 70} cy={node.y + 8} r={3} fill="#ea580c">
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
    </svg>
  );
}

/* ── main about section ── */
export function AboutSection() {
  return (
    <section id="about" className="w-full px-6 py-20 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: ABOUT_REVENANT"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          005
        </span>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-0 border-2 border-foreground">
        {/* Left: memory network visualization */}
        <motion.div
          initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative w-full lg:w-1/2 min-h-[300px] lg:min-h-[500px] border-b-2 lg:border-b-0 lg:border-r-2 border-foreground overflow-hidden bg-foreground"
        >
          {/* Label overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] tracking-[0.2em] uppercase text-background/60 font-mono">
              RENDER: memory_network.topology
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#ea580c] font-mono">
              LIVE
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center p-8 pt-12">
            <MemoryNetworkViz />
          </div>

          {/* Bottom coordinates */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] tracking-[0.2em] uppercase text-background/40 font-mono">
              NODES: 8 / EDGES: 7
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-background/40 font-mono">
              SYNC: REAL-TIME
            </span>
          </div>
        </motion.div>

        {/* Right: content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="flex flex-col w-full lg:w-1/2"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              MANIFEST.md
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              v1.2.0
            </span>
          </div>

          {/* Content body */}
          <div className="flex-1 flex flex-col justify-between px-5 py-6 lg:py-8">
            <div className="flex flex-col gap-6">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: 0.2, ease }}
                className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-balance"
              >
                Memory built for
                <br />
                <span className="text-[#ea580c]">raw engineering judgment</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="flex flex-col gap-4"
              >
                <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed">
                  We build the substrate layer that sits between your senior engineers&apos;
                  knowledge and your growing team. No generic docs. No lossy wikis. Just
                  deterministic memory capture, semantic recall, and an AI mentor your
                  engineers can actually interrogate.
                </p>
                <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed">
                  Founded by engineers who watched critical decisions vanish when senior
                  talent left. We believe engineering judgment should be auditable,
                  searchable, and brutally preserved.
                </p>
              </motion.div>

              {/* Live memory counter */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.8 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease }}
                style={{ transformOrigin: "left" }}
                className="flex items-center gap-3 py-3 border-t-2 border-b-2 border-foreground"
              >
                <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                  LIVE MEMORY:
                </span>
                <MemoryCounter />
              </motion.div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-0 mt-6">
              {STATS.map((stat, i) => (
                <StatBlock key={stat.label} {...stat} index={i} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
