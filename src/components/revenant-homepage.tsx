"use client";

import Image from "next/image";
import Link from "next/link";
import { RevenantHeroCanvas } from "@/components/revenant-hero-canvas";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import {
  BrainCircuit,
  Menu,
  MessageSquareShare,
  Network,
  ShieldCheck,
  X,
} from "lucide-react";

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#workflows", label: "Workflows" },
  { href: "#integrations", label: "Integrations" },
  { href: "#pilot", label: "Pilot" },
];

const integrations = [
  { name: "Slack", src: "/slack.png", width: 112, height: 34 },
  { name: "GitHub", src: "/github.png", width: 112, height: 34 },
  { name: "Jira", src: "/jira.png", width: 112, height: 34 },
  { name: "Gmail", src: "/gmail.webp", width: 112, height: 34 },
];

const pillars = [
  {
    icon: BrainCircuit,
    title: "Memory capture that keeps the why",
    description:
      "Pull decisions out of PRs, Slack threads, tickets, and handoffs before they dissolve into folklore.",
  },
  {
    icon: MessageSquareShare,
    title: "A mentor interface engineers will use",
    description:
      "Ask why a service exists, what broke last quarter, or who approved a pattern and get grounded answers back.",
  },
  {
    icon: Network,
    title: "Cross-tool recall instead of scattered context",
    description:
      "Revenant stitches source material into one queryable memory layer instead of another disconnected dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable context for onboarding and incidents",
    description:
      "Trace every answer back to the source artifact so institutional memory stays inspectable, not hallucinatory.",
  },
];

const workflowRows = [
  {
    title: "Capture",
    copy: "Sync GitHub activity, tickets, inboxes, and team chat into one memory stream without asking engineers to write more docs.",
    label: "INGESTION",
  },
  {
    title: "Interpret",
    copy: "Cluster repeated decisions, summarize tradeoffs, and promote important context into durable company memory.",
    label: "PROMOTION",
  },
  {
    title: "Mentor",
    copy: "Give every engineer an always-on context partner for architecture questions, legacy systems, and incident history.",
    label: "RECALL",
  },
];

const auditTrail = [
  {
    event: "Auth service rollback approved",
    source: "GitHub PR #481",
    impact: "Recovered deploy in 12m",
  },
  {
    event: "Billing retry policy changed",
    source: "Slack #platform-ops",
    impact: "Cut duplicate charges",
  },
  {
    event: "Search shard split postponed",
    source: "Jira ARC-219",
    impact: "Avoided risky migration",
  },
  {
    event: "On-call runbook updated",
    source: "Gmail vendor thread",
    impact: "Faster escalation path",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease },
  }),
};

function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 flex w-full flex-col items-center border-b border-black/10 bg-white p-2 text-black transition-[background-color,border-color,color,translate] duration-300 md:top-4 md:left-1/2 md:w-[calc(100%-2rem)] md:max-w-[1240px] md:-translate-x-1/2 md:border md:px-2 md:py-[8px]">
      <div className="w-full">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 px-2 font-ui-mono text-sm tracking-[-0.28px]">
            <span className="flex size-6 items-center justify-center rounded-full bg-black text-white">
              <BrainCircuit size={14} />
            </span>
            <span className="font-medium uppercase">REVENANT</span>
          </Link>

          <div className="hidden items-center gap-5 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2 font-ui-mono text-sm tracking-[-0.28px] text-black transition-colors duration-300 hover:text-black/60"
              >
                {link.label.toUpperCase()}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="px-2 font-ui-mono text-sm tracking-[-0.28px] text-black/60 transition-colors duration-300 hover:text-black"
            >
              LOG IN
            </Link>
            <Link
              href="/signup"
              className="bg-black px-2 py-1.5 font-ui-mono text-sm tracking-[-0.28px] text-white transition-colors duration-300 hover:bg-black/85"
            >
              START PILOT
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-8 items-center justify-center lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {open ? (
          <div className="w-full overflow-hidden border-t border-black/10 pt-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-2 py-2 font-ui-mono text-sm tracking-[-0.28px] text-black"
                  onClick={() => setOpen(false)}
                >
                  {link.label.toUpperCase()}
                </a>
              ))}
              <div className="mt-2 flex items-center gap-3">
                <Link href="/login" className="px-2 font-ui-mono text-sm tracking-[-0.28px] text-black/60">
                  LOG IN
                </Link>
                <Link
                  href="/signup"
                  className="bg-black px-2 py-1.5 font-ui-mono text-sm tracking-[-0.28px] text-white"
                >
                  START PILOT
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function LogoMarquee() {
  const items = [...integrations, ...integrations];

  return (
    <div id="integrations" className="relative z-10 w-screen invert md:mt-4">
      <div className="flex w-full items-center justify-center">
        <div
          className="logoloop rev-logoloop w-full max-w-[800px] overflow-hidden px-4 py-[14px] grayscale"
          style={{
            ["--logoloop-gap" as string]: "64px",
            ["--logoloop-logoHeight" as string]: "26px",
            maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)",
          }}
        >
          <div className="logoloop__track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="logoloop__list" role="list" aria-hidden={copy === 1 ? true : undefined}>
                {items.map((item, index) => (
                  <li key={`${item.name}-${copy}-${index}`} className="logoloop__item" role="listitem">
                    <Image
                      src={item.src}
                      alt={item.name}
                      width={item.width}
                      height={item.height}
                      className="w-auto object-contain"
                      style={{ height: item.height > 30 ? "34px" : item.name === "Jira" ? "25px" : "30px" }}
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_SCENARIOS = [
  {
    question: "Why did the team keep auth retry logic inside deploy sequencing instead of moving it to the worker queue?",
    answer: "During the April incident, queue delays caused token expiry during blue-green cutovers. The coupling stayed in place — the rollback conditions were captured in review threads and the postmortem.",
    sources: ["GitHub PR #481", "Slack #auth-war-room", "Jira ARC-219"],
  },
  {
    question: "Why was the search shard split postponed even after the migration plan was approved?",
    answer: "Storage growth outpaced the original estimate. The split was delayed until the new rollback window and runbook were in place — capacity notes are linked in ARC-312.",
    sources: ["GitHub migration review", "Jira ARC-312", "Release chat"],
  },
  {
    question: "Why did billing stop retrying failed renewals immediately after the duplicate-charge incident?",
    answer: "The team found retries could replay against stale payment intents. Finance approved a slower retry window until idempotency checks shipped.",
    sources: ["Slack #billing-ops", "Incident DB", "GitHub policy diff"],
  },
];

function OrbDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "thinking" | "answering" | "sources" | "idle">("idle");
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [simLevel, setSimLevel] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scenario = DEMO_SCENARIOS[scenarioIdx];

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => setIsInView(e.isIntersecting), { threshold: 0.3 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const runScenario = useCallback(() => {
    const sc = DEMO_SCENARIOS[scenarioIdx];
    setDisplayedQuestion("");
    setDisplayedAnswer("");
    setPhase("typing");

    let qi = 0;
    const typeQuestion = () => {
      if (qi <= sc.question.length) {
        setDisplayedQuestion(sc.question.slice(0, qi));
        setSimLevel(qi % 3 === 0 ? 0.3 + Math.random() * 0.4 : 0.1);
        qi++;
        timerRef.current = setTimeout(typeQuestion, 28 + Math.random() * 22);
      } else {
        setSimLevel(0);
        setPhase("thinking");
        timerRef.current = setTimeout(() => {
          setPhase("answering");
          let ai = 0;
          const typeAnswer = () => {
            if (ai <= sc.answer.length) {
              setDisplayedAnswer(sc.answer.slice(0, ai));
              setSimLevel(ai % 4 === 0 ? 0.15 + Math.random() * 0.25 : 0.05);
              ai++;
              timerRef.current = setTimeout(typeAnswer, 16 + Math.random() * 14);
            } else {
              setSimLevel(0);
              setPhase("sources");
              timerRef.current = setTimeout(() => {
                setPhase("idle");
                timerRef.current = setTimeout(() => {
                  setScenarioIdx((p) => (p + 1) % DEMO_SCENARIOS.length);
                }, 3000);
              }, 2500);
            }
          };
          typeAnswer();
        }, 1800);
      }
    };
    typeQuestion();
  }, [scenarioIdx]);

  useEffect(() => {
    if (!isInView) return;
    runScenario();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isInView, scenarioIdx, runScenario]);

  return (
    <div ref={sectionRef} className="relative z-10 mt-10 w-full max-w-[1240px] border-t border-white/[0.08] px-4 pt-10 lg:px-0">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Orb */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-[320px] w-[320px] md:h-[380px] md:w-[380px]">
            <VoicePoweredOrb
              hue={25}
              enableVoiceControl={false}
              simulatedLevel={simLevel}
              className="overflow-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="size-2"
              style={{
                borderRadius: "50%",
                background: phase === "idle" ? "rgba(255,255,255,0.15)" : "#ffb25d",
                boxShadow: phase !== "idle" ? "0 0 12px rgba(255,178,93,0.6)" : "none",
                transition: "all 0.3s",
              }}
            />
            <span className="font-ui-mono text-[10px] tracking-[0.12em] text-white/30">
              {phase === "typing" ? "LISTENING" : phase === "thinking" ? "RECALLING" : phase === "answering" ? "RESPONDING" : phase === "sources" ? "SOURCES ATTACHED" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Chat simulation */}
        <div className="flex flex-col border border-white/[0.08] bg-[#0f0f0f]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
            <span className="size-[5.82px] bg-[#ffb25d]" />
            <span className="font-ui-mono text-[11px] tracking-[-0.28px] text-white/40">FOUNDER MENTOR</span>
          </div>

          <div className="flex min-h-[280px] flex-col gap-5 px-5 py-5">
            {/* Question */}
            <AnimatePresence mode="wait">
              {displayedQuestion && (
                <motion.div
                  key={`q-${scenarioIdx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="self-end"
                >
                  <div className="border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] leading-relaxed text-white/60">
                    &ldquo;{displayedQuestion}
                    {phase === "typing" && <span className="ml-0.5 inline-block h-4 w-[2px] bg-[#ffb25d] animate-blink" />}
                    &rdquo;
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thinking indicator */}
            {phase === "thinking" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 font-ui-mono text-[11px] text-white/20"
              >
                <span>Searching founder memory</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.16 }}
                      className="size-1.5 bg-[#ffb25d]"
                      style={{ borderRadius: "50%" }}
                    />
                  ))}
                </span>
              </motion.div>
            )}

            {/* Answer */}
            <AnimatePresence mode="wait">
              {displayedAnswer && (
                <motion.div
                  key={`a-${scenarioIdx}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="border-l-2 border-[#ffb25d] pl-4 text-[15px] leading-relaxed text-white/75">
                    {displayedAnswer}
                    {phase === "answering" && <span className="ml-0.5 inline-block h-4 w-[2px] bg-[#ffb25d] animate-blink" />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sources */}
            <AnimatePresence>
              {(phase === "sources" || phase === "idle") && scenario.sources && displayedAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-auto flex flex-wrap gap-2"
                >
                  {scenario.sources.map((src, i) => (
                    <motion.span
                      key={src}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.12 }}
                      className="border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-ui-mono text-[10px] tracking-[-0.28px] text-[#ffb25d]"
                    >
                      {src}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RevenantHomepage() {
  return (
    <div className="rev-page bg-[#050505] text-white">
      <Nav />

      <main className="overflow-hidden">
        <section className="rev-hero-grid rev-noise relative flex min-h-dvh flex-col items-center overflow-hidden bg-[#0f0f0f] pt-[60px] md:pt-0">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] md:h-[700px] lg:h-[780px]">
            <RevenantHeroCanvas />
          </div>
          <div className="relative mx-auto flex w-full max-w-[1240px] flex-1 flex-col items-center justify-center gap-0 px-0 pt-0 md:flex-none md:justify-start md:gap-10 md:px-4 md:pt-[120px] md:pb-24 lg:pt-[160px]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="relative z-10 flex flex-col items-center gap-5 px-5 pb-6 text-center md:gap-6 md:px-0"
            >
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <h1 className="font-display text-4xl leading-[1.15] text-white md:whitespace-nowrap md:text-5xl md:leading-[0.87] lg:text-[64px]">
                  Your team ships
                  <br className="md:hidden" /> what to do.
                </h1>
                <p className="font-display text-4xl leading-[0.95] text-white md:whitespace-nowrap md:text-5xl md:leading-[0.87] lg:text-[64px]">
                  Revenant keeps the why.
                </p>
              </div>
              <p className="max-w-[540px] text-center text-base leading-[1.4] text-white/50 md:text-lg md:leading-[1.2]">
                Capture the rationale behind pull requests, incidents, tickets, and chat threads, then turn it into source-grounded engineering memory.
              </p>
            </motion.div>

            <div className="relative z-10 px-5 pb-14 md:px-0 md:pb-8">
              <Link
                href="/signup"
                className="relative z-10 bg-white px-4 py-2.5 font-ui-mono text-sm tracking-[-0.28px] text-black transition-colors hover:bg-white/90"
              >
                START PILOT
              </Link>
            </div>

            <hr className="mt-4 w-full max-w-[calc(100%-40px)] border-white/10 md:hidden" />

            <LogoMarquee />

            <OrbDemo />
          </div>
        </section>

        <section id="product" className="bg-[#f6f6f6]">
          <div className="mx-auto w-full max-w-[1240px] border-x border-black/[0.06] px-4 lg:px-0">
            <div className="flex flex-col gap-8 px-2 py-14 md:py-16">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={reveal}
                className="flex flex-col gap-6"
              >
                <div className="flex h-6 items-center gap-2 self-start px-2 py-1.5">
                  <div className="size-[5.82px] bg-black" />
                  <span className="font-ui-mono text-sm tracking-[-0.28px] text-black">
                    ONE MEMORY LAYER, EVERY ENGINEERING WORKFLOW
                  </span>
                </div>
                <h2 className="max-w-[474px] font-display text-3xl leading-[0.9] text-black md:text-4xl lg:text-[48px]">
                  Replace scattered tribal knowledge with context your team can reuse.
                </h2>
              </motion.div>

              <div className="relative mt-4 grid gap-px border border-black/[0.08] bg-black/[0.08] lg:grid-cols-2">
                <div className="bg-[#f6f6f6] p-5 lg:p-8">
                  <p className="font-ui-mono text-sm tracking-[-0.28px] text-black/48">CAPTURE SURFACE</p>
                  <h3 className="mt-4 text-2xl leading-[1.2] text-black lg:text-[32px]">
                    A system that listens where engineering judgment actually happens
                  </h3>
                  <p className="mt-4 max-w-[500px] text-base leading-[1.4] text-black/65">
                    Revenant joins the tools your team already uses and continuously indexes reasoning, approvals, tradeoffs, and incident context.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {["Architecture debates", "Rollback rationale", "Runbook patches", "Vendor escalations"].map((item) => (
                      <div key={item} className="border border-black/[0.08] bg-black/[0.02] px-4 py-4">
                        <p className="font-ui-mono text-xs tracking-[-0.28px] text-black/40">CAPTURED</p>
                        <p className="mt-2 text-base text-black/74">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f0f0f] p-5 text-white lg:p-8">
                  <p className="font-ui-mono text-sm tracking-[-0.28px] text-white/50">MENTOR INTERFACE</p>
                  <h3 className="mt-4 text-2xl leading-[1.2] text-white lg:text-[32px]">
                    Ask for precedent, not another summary
                  </h3>
                  <p className="mt-4 max-w-[500px] text-base leading-[1.4] text-white/60">
                    Engineers get source-grounded answers with links back to the pull requests, threads, and tickets that created the decision in the first place.
                  </p>
                  <div className="mt-6 border border-white/[0.08] bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between font-ui-mono text-xs tracking-[-0.28px] text-white/45">
                      <span>QUESTION</span>
                      <span>MENTOR REPLY</span>
                    </div>
                    <div className="mt-6 space-y-5">
                      <p className="text-base leading-7 text-white/82">
                        Why is auth retry logic still coupled to deploy sequencing?
                      </p>
                      <div className="border-l border-[#d99a57] pl-4 text-base leading-7 text-white/62">
                        During the April incident, queue delays caused token expiry during blue-green cutovers. The coupling stayed in place and the rollback conditions were captured in review threads and the postmortem.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-px border border-black/[0.08] bg-black/[0.08] md:grid-cols-2 xl:grid-cols-4">
                {pillars.map((pillar, index) => {
                  const Icon = pillar.icon;

                  return (
                    <motion.div
                      key={pillar.title}
                      custom={index * 0.08}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-60px" }}
                      variants={reveal}
                      className="bg-[#f6f6f6] p-6"
                    >
                      <div className="flex size-12 items-center justify-center bg-black text-white">
                        <Icon size={20} />
                      </div>
                      <h3 className="mt-5 text-xl leading-[1.2] text-black">{pillar.title}</h3>
                      <p className="mt-3 text-base leading-7 text-black/62">{pillar.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="workflows" className="flex w-full justify-center bg-[#0f0f0f] px-4 py-24 md:px-6">
          <div className="w-full max-w-[1240px]">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-8 px-0">
                <div className="flex items-center gap-2 self-start border border-white px-2 py-1">
                  <div className="size-[5.82px] bg-white" />
                  <span className="font-ui-mono text-sm tracking-[-0.28px] text-white">FOR ENGINEERING TEAMS</span>
                </div>
                <h2 className="text-3xl leading-[0.9] text-[#f6f6f6] md:text-4xl lg:text-[48px]">
                  Built for the moments where context loss becomes expensive
                </h2>
                <Link
                  href="/integrations"
                  className="flex w-fit items-center justify-center bg-white px-2 py-1.5 font-ui-mono text-sm tracking-[-0.28px] text-black"
                >
                  SEE THE PLATFORM
                </Link>
              </div>

              <div className="mt-12 flex flex-col md:mt-20">
                <div className="flex flex-col lg:flex-row">
                  {workflowRows.slice(0, 2).map((row) => (
                    <div key={row.title} className="relative h-auto min-h-[196px] w-full border border-[#2c2c2c] lg:w-[620px]">
                      <div className="flex h-auto w-full flex-col gap-4 p-5 lg:h-[158px] lg:w-[434px]">
                        <h3 className="text-xl font-medium leading-[1.2] text-white">{row.title}</h3>
                        <p className="max-w-[380px] text-base leading-[1.2] text-[#ececec] opacity-80">{row.copy}</p>
                        <div className="flex w-fit items-center justify-center bg-white/12 px-2 py-1.5 font-ui-mono text-sm tracking-[-0.28px] text-white/64">
                          {row.label}
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 hidden h-[196px] w-[166px] overflow-hidden border-l border-[#2c2c2c] bg-[#1b1b1b] lg:block">
                        <div className="flex h-full items-center justify-center px-4 text-center font-ui-mono text-xs tracking-[-0.28px] text-white/28">
                          {row.title.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block">
                  <div className="relative h-[54px] w-full">
                    <div className="absolute top-0 right-0 left-0 flex h-[27px]">
                      {[191, 138, 245, 109, 191, 119, 181].map((width, index) => (
                        <div key={`top-${index}`} className="h-[27px] shrink-0 border border-[#2c2c2c] bg-[#0f0f0f]" style={{ width }} />
                      ))}
                      <div className="h-[27px] min-w-0 flex-1 border border-[#2c2c2c] bg-[#0f0f0f]" />
                    </div>
                    <div className="absolute top-[27px] right-0 left-0 flex h-[27px]">
                      {[124, 259, 124, 191, 191, 124, 88].map((width, index) => (
                        <div key={`bottom-${index}`} className="h-[27px] shrink-0 border border-[#2c2c2c] bg-[#0f0f0f]" style={{ width }} />
                      ))}
                      <div className="h-[27px] min-w-0 flex-1 border border-[#2c2c2c] bg-[#0f0f0f]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                  <div className="relative -mt-px h-[350px] w-full overflow-hidden border border-[#2c2c2c] md:h-[350px] lg:mt-0 lg:h-[400px] lg:w-[620px]">
                    <div className="px-5 pt-6">
                      <h3 className="text-2xl leading-[1.2] text-white">Decision Audit Trail</h3>
                    </div>
                    <div className="absolute inset-x-0 top-20 bottom-0 overflow-hidden px-5 pb-[118px]">
                      <div className="space-y-3">
                        {auditTrail.map((row) => (
                          <div key={row.event} className="border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm text-white/84">{row.event}</p>
                                <p className="mt-1 font-ui-mono text-[11px] tracking-[-0.28px] text-white/34">{row.source}</p>
                              </div>
                              <span className="font-ui-mono text-[10px] tracking-[-0.28px] text-[#d99a57]">{row.impact}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex h-auto flex-col gap-3 border-t border-[#2c2c2c] bg-[#1e1e1e] p-4 md:p-[18px]">
                      <p className="max-w-[480px] text-sm leading-[1.3] text-[#ececec] opacity-80 md:text-base md:leading-[1.2]">
                        Follow how operational decisions move from pull requests and incidents into reusable engineering memory.
                      </p>
                    </div>
                  </div>

                  <div className="relative -mt-px h-[350px] w-full overflow-hidden border border-[#2c2c2c] md:h-[350px] lg:mt-0 lg:h-[400px] lg:w-[620px]">
                    <div className="relative z-10 bg-[#0f0f0f] p-1 px-5 pt-6">
                      <h3 className="text-2xl leading-[1.2] text-white">Source-Grounded Recall</h3>
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,154,87,0.26),transparent_30%),linear-gradient(180deg,#111_0%,#171717_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 z-10 flex h-auto flex-col gap-3 border-t border-[#2c2c2c] bg-[#1e1e1e] p-4 md:p-[18px]">
                      <p className="max-w-[480px] text-sm leading-[1.3] text-[#ececec] opacity-80 md:text-base md:leading-[1.2]">
                        Engineers ask a question once and get the answer, the precedent, and the artifact trail that supports it.
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {pillars.slice(0, 2).map((pillar) => (
                          <div key={pillar.title} className="border border-white/[0.08] bg-white/[0.04] px-3 py-3">
                            <div className="font-ui-mono text-[11px] tracking-[-0.28px] text-white/30">
                              {pillar.title.toUpperCase()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pilot" className="bg-[#f6f6f6]">
          <div className="mx-auto w-full max-w-[1240px] border-x border-black/[0.06]">
            <div className="flex flex-col items-center gap-6 px-6 py-14 text-center md:py-16">
              <h2 className="font-display text-3xl leading-tight text-black md:text-4xl lg:text-5xl">
                Your team is shipping.
                <br className="lg:hidden" />
                <span className="hidden lg:inline"> </span>
                Are you preserving the judgment?
              </h2>
              <Link
                href="/signup"
                className="mt-2 flex h-10 items-center justify-center bg-black px-6 font-ui-mono text-sm tracking-[-0.28px] text-white transition-colors hover:bg-black/85"
              >
                START REVENANT TODAY
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

