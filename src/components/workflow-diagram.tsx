"use client";

import { motion } from "framer-motion";

const LEFT_LABELS = ["Slack", "GitHub", "Jira"];
const RIGHT_LABELS = ["Mentor", "Recall", "Plan"];

function PillLabel({
  label,
  x,
  y,
  delay,
}: {
  label: string;
  x: number;
  y: number;
  delay: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, x: x > 400 ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <rect
        x={x}
        y={y}
        width={80}
        height={26}
        rx={13}
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth={1.5}
      />
      <text
        x={x + 40}
        y={y + 17}
        textAnchor="middle"
        fill="var(--color-foreground)"
        fontSize={10}
        fontFamily="var(--font-jetbrains), monospace"
        fontWeight={500}
        letterSpacing="0.05em"
      >
        {label}
      </text>
    </motion.g>
  );
}

export function WorkflowDiagram() {
  const centerX = 400;
  const centerY = 100;

  return (
    <div className="relative w-full max-w-[800px] mx-auto">
      <svg
        viewBox="0 0 800 200"
        className="w-full h-auto"
        role="img"
        aria-label="Workflow diagram showing Revenant memory flow: Slack, GitHub, Jira captured into Revenant, then powering Mentor, Recall, and Plan"
      >
        {/* Left lines from center to left labels */}
        {LEFT_LABELS.map((_, i) => {
          const pillX = 60;
          const pillY = 30 + i * 60;
          return (
            <motion.line
              key={`left-line-${i}`}
              x1={centerX - 40}
              y1={centerY}
              x2={pillX + 80}
              y2={pillY + 13}
              stroke="var(--color-border)"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
            />
          );
        })}

        {/* Right lines from center to right labels */}
        {RIGHT_LABELS.map((_, i) => {
          const pillX = 660;
          const pillY = 30 + i * 60;
          return (
            <motion.line
              key={`right-line-${i}`}
              x1={centerX + 40}
              y1={centerY}
              x2={pillX}
              y2={pillY + 13}
              stroke="var(--color-border)"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
            />
          );
        })}

        {/* Data packets flowing left → center */}
        {LEFT_LABELS.map((_, i) => {
          const pillX = 60;
          const pillY = 30 + i * 60;
          return (
            <motion.circle
              key={`left-packet-${i}`}
              r={3}
              fill="#ea580c"
              initial={{ cx: pillX + 80, cy: pillY + 13 }}
              animate={{
                cx: [pillX + 80, centerX - 40],
                cy: [pillY + 13, centerY],
              }}
              transition={{
                duration: 1.8,
                delay: 0.8 + i * 0.6,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "linear",
              }}
            />
          );
        })}

        {/* Data packets flowing center → right */}
        {RIGHT_LABELS.map((_, i) => {
          const pillX = 660;
          const pillY = 30 + i * 60;
          return (
            <motion.circle
              key={`right-packet-${i}`}
              r={3}
              fill="#ea580c"
              initial={{ cx: centerX + 40, cy: centerY }}
              animate={{
                cx: [centerX + 40, pillX],
                cy: [centerY, pillY + 13],
              }}
              transition={{
                duration: 1.8,
                delay: 1.2 + i * 0.6,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "linear",
              }}
            />
          );
        })}

        {/* Left pill labels */}
        {LEFT_LABELS.map((label, i) => (
          <PillLabel
            key={`left-${label}`}
            label={label}
            x={60}
            y={30 + i * 60}
            delay={0.1 + i * 0.1}
          />
        ))}

        {/* Right pill labels */}
        {RIGHT_LABELS.map((label, i) => (
          <PillLabel
            key={`right-${label}`}
            label={label}
            x={660}
            y={30 + i * 60}
            delay={0.1 + i * 0.1}
          />
        ))}

        {/* Center memory core square */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <rect
            x={centerX - 36}
            y={centerY - 36}
            width={72}
            height={72}
            fill="var(--color-muted)"
            stroke="var(--color-border)"
            strokeWidth={1.5}
          />
          {/* RVN brain-like symbol */}
          <line
            x1={centerX}
            y1={centerY - 18}
            x2={centerX}
            y2={centerY + 18}
            stroke="var(--color-foreground)"
            strokeWidth={3}
          />
          <line
            x1={centerX - 18}
            y1={centerY}
            x2={centerX + 18}
            y2={centerY}
            stroke="var(--color-foreground)"
            strokeWidth={3}
          />
          <line
            x1={centerX - 12}
            y1={centerY - 12}
            x2={centerX + 12}
            y2={centerY + 12}
            stroke="var(--color-foreground)"
            strokeWidth={2}
          />
          <line
            x1={centerX + 12}
            y1={centerY - 12}
            x2={centerX - 12}
            y2={centerY + 12}
            stroke="var(--color-foreground)"
            strokeWidth={2}
          />
          {/* Pulsing ring */}
          <circle cx={centerX} cy={centerY} r={30} fill="none" stroke="#ea580c" strokeWidth={1}>
            <animate
              attributeName="r"
              values="30;34;30"
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
        </motion.g>
      </svg>
    </div>
  );
}
