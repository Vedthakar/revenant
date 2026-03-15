"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mic, MicOff, Send, Settings, Terminal, Database, Sparkles, ChevronRight, Activity, X, Code2, FileText, ExternalLink, BookOpen, Zap, Brain, Radio, BrainCircuit } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type LogType = "info" | "success" | "warning" | "error" | "system";
type SidebarTab = "terminal" | "memory" | "code";

interface LogItem { id: number; text: string; type: LogType; timestamp: string; }
interface MemoryItem { id: number; title: string; excerpt: string; cluster: string; strength?: number; }
interface SourceItem { id: string; content: string; namespace: string; source_ref?: string; }
interface CodeFile { path: string; content: string; highlightLines?: number[]; }

// Colors matched to the landing page design system
const C = {
  bg: "#050505",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.1)",
  borderAccent: "rgba(255,178,93,0.3)",
  accent: "#ffb25d",
  accentGlow: "rgba(255,178,93,0.75)",
  muted: "rgba(255,255,255,0.4)",
  mutedStrong: "rgba(255,255,255,0.6)",
  text: "rgba(255,255,255,0.88)",
  purple: "#c084fc",
  green: "#86efac",
  amber: "#fbbf24",
};

const ease = [0.22, 1, 0.36, 1] as const;
const now = () => new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

function highlightLine(line: string): React.ReactNode {
  const keywords = /\b(import|export|from|const|let|var|function|return|if|else|async|await|try|catch|new|class|extends|interface|type|enum)\b/g;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /(\/\/.*$)/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  if (comments.test(line)) return <span style={{ color: "rgba(255,255,255,0.25)" }}>{line}</span>;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const allMatches: { index: number; length: number; type: string; text: string }[] = [];
  let match;
  keywords.lastIndex = 0;
  while ((match = keywords.exec(line)) !== null) allMatches.push({ index: match.index, length: match[0].length, type: "keyword", text: match[0] });
  strings.lastIndex = 0;
  while ((match = strings.exec(line)) !== null) allMatches.push({ index: match.index, length: match[0].length, type: "string", text: match[0] });
  numbers.lastIndex = 0;
  while ((match = numbers.exec(line)) !== null) allMatches.push({ index: match.index, length: match[0].length, type: "number", text: match[0] });
  allMatches.sort((a, b) => a.index - b.index);
  for (const m of allMatches) {
    if (m.index < lastIndex) continue;
    if (m.index > lastIndex) parts.push(line.slice(lastIndex, m.index));
    const color = m.type === "keyword" ? "#c084fc" : m.type === "string" ? "#86efac" : "#ffb25d";
    parts.push(<span key={m.index} style={{ color }}>{m.text}</span>);
    lastIndex = m.index + m.length;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts.length > 0 ? <>{parts}</> : line;
}

function extractFileRefs(text: string): { path: string; line?: number }[] {
  const pattern = /(?:^|\s|`)((?:src|backend|tools)\/[\w/.-]+\.(?:ts|tsx|js|py|json|md))(?::(\d+))?/g;
  const refs: { path: string; line?: number }[] = [];
  let m;
  while ((m = pattern.exec(text)) !== null) refs.push({ path: m[1], line: m[2] ? parseInt(m[2]) : undefined });
  return refs;
}

export default function AppDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [tavusUrl, setTavusUrl] = useState<string | null>(null);
  const [tavusError, setTavusError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("terminal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefInput, setPrefInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [citedSources, setCitedSources] = useState<SourceItem[]>([]);
  const [codeFile, setCodeFile] = useState<CodeFile | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [pipelinePhase, setPipelinePhase] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [memory, setMemory] = useState<MemoryItem[]>([]);

  const logsEnd = useRef<HTMLDivElement>(null);
  const memoryEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const addLog = useCallback((text: string, type: LogType = "info") => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), text, type, timestamp: now() }]);
  }, []);

  const addMemory = useCallback((title: string, excerpt: string, cluster: string, strength?: number) => {
    setMemory((prev) => [{ id: Date.now() + Math.random(), title, excerpt, cluster, strength }, ...prev]);
  }, []);

  const staggerLogs = useCallback((entries: [string, LogType][], baseDelay = 300) => {
    entries.forEach(([text, type], i) => {
      setTimeout(() => addLog(text, type), baseDelay * (i + 1));
    });
  }, [addLog]);

  useEffect(() => { logsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { memoryEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [memory]);

  const loadFileInViewer = useCallback(async (filePath: string, highlightLineNum?: number) => {
    setCodeLoading(true);
    setSidebarTab("code");
    setSidebarOpen(true);
    try {
      const res = await fetch("/api/nanoclaw/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "read_file", input: { path: filePath } }),
      });
      const data = await res.json();
      if (data.content) {
        setCodeFile({ path: filePath, content: data.content, highlightLines: highlightLineNum ? [highlightLineNum] : [] });
        addLog(`Code viewer: ${filePath}`, "info");
      }
    } catch {
      addLog(`Failed to load: ${filePath}`, "error");
    } finally {
      setCodeLoading(false);
    }
  }, [addLog]);

  const startConversation = useCallback(async () => {
    try {
      setPipelinePhase("init");
      addLog("REVENANT v2.0 — Founder Preservation System", "system");

      staggerLogs([
        ["Initializing cognitive memory pipeline...", "info"],
        ["Connecting to Moorcheh AI vector store...", "info"],
        ["Querying founder-semantic namespace...", "info"],
        ["Querying founder-episodic namespace...", "info"],
        ["Querying founder-procedural namespace...", "info"],
      ], 400);

      await new Promise((r) => setTimeout(r, 2200));

      setPipelinePhase("memory");
      addLog("Three-namespace retrieval complete.", "success");
      addMemory("Semantic memory", "Architecture decisions and technical conventions loaded.", "Semantic", 0.95);
      addMemory("Episodic memory", "Founder stories and pivotal moments available.", "Episodic", 0.88);
      addMemory("Procedural memory", "Decision frameworks and playbooks ready.", "Procedural", 0.92);

      await new Promise((r) => setTimeout(r, 600));
      setPipelinePhase("avatar");
      addLog("Establishing Tavus avatar session...", "info");
      addLog("Injecting founder memory into conversational context...", "info");

      const response = await fetch("/api/tavus", { method: "POST" });
      const data = await response.json();

      if (response.status === 402) {
        setTavusError("402: Tavus credits required");
        addLog("Avatar connection requires Tavus credits.", "error");
        setPipelinePhase(null);
        return;
      }

      if (data.conversation_url) {
        setTavusUrl(data.conversation_url);
        setConversationId(data.conversation_id);
        const meta = data._meta;
        staggerLogs([
          [`Conversation: ${data.conversation_id?.slice(0, 12)}...`, "success"],
          [meta?.memory_loaded ? `Memory injected: ${meta.source_count} sources across ${meta.namespaces?.join(", ")}` : "Memory: awaiting seed data", meta?.memory_loaded ? "success" : "warning"],
          ["Ebbinghaus decay engine active.", "success"],
          ["Avatar video stream connected.", "success"],
          ["READY — Ask the founder about architecture, tradeoffs, or decisions.", "system"],
        ], 350);
        setPipelinePhase("live");
      } else {
        setTavusError(data.error || "Unknown error");
        addLog(`Tavus error: ${data.error}`, "error");
        setPipelinePhase(null);
      }
    } catch (error: any) {
      setTavusError(error.message);
      addLog(`Connection error: ${error.message}`, "error");
      setPipelinePhase(null);
    }
  }, [addLog, addMemory, staggerLogs]);

  useEffect(() => { if (mounted) startConversation(); }, [mounted, startConversation]);

  const GITHUB = /https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)/;

  const handleSend = useCallback(async () => {
    const question = chatInput.trim();
    if (!question || isWorking) return;
    setChatInput("");

    const repoMatch = question.match(GITHUB);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      setSidebarOpen(true);
      setSidebarTab("terminal");
      setIsWorking(true);
      addLog(`Repository scout: ${owner}/${repo}`, "info");
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`).then((r) => r.json());
        const tree = Array.isArray(response) ? response.map((f: any) => `${f.type === "dir" ? "[dir]" : "[file]"} ${f.name}`).join("\n") : "";
        addLog("Repository indexed.", "success");
        addMemory("Repository", `${owner}/${repo} loaded.`, "Context");
        if (conversationId) {
          addLog("Injecting repo context into avatar...", "info");
          await fetch("/api/tavus/inject-context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation_id: conversationId, context: `Repository context for ${owner}/${repo}:\n${tree}` }),
          });
          addLog("Context injected.", "success");
        }
      } catch (error: any) {
        addLog(`Scout error: ${error.message}`, "error");
      } finally {
        setIsWorking(false);
      }
      return;
    }

    setSidebarOpen(true);
    setSidebarTab("terminal");
    setIsWorking(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    staggerLogs([
      [`Query: "${question.slice(0, 50)}${question.length > 50 ? "..." : ""}"`, "info"],
      ["Searching founder-semantic...", "info"],
      ["Searching founder-episodic...", "info"],
      ["Searching founder-procedural...", "info"],
    ], 200);

    try {
      await new Promise((r) => setTimeout(r, 900));
      addLog("Reranking by decayed_strength * similarity...", "info");
      addLog("Injecting context into Claude...", "info");

      const response = await fetch("/api/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: question }] }),
      });
      const data = await response.json();

      if (data.choices?.[0]) {
        const reply = data.choices[0].message.content;
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        const meta = data.context_metadata;
        if (meta) {
          const ns = [meta.has_semantic && "semantic", meta.has_episodic && "episodic", meta.has_procedural && "procedural"].filter(Boolean);
          addLog(`Memory: ${ns.join(", ") || "none"}`, "success");
          if (meta.reinforced_ids?.length) addLog(`Reinforced ${meta.reinforced_ids.length} memories`, "success");
        }
        addLog(`Response (${reply.length} chars)`, "success");
        if (meta?.sources?.length) {
          setCitedSources(meta.sources);
          meta.sources.forEach((s: any) => addMemory(s.namespace, s.content.slice(0, 80) + "...", s.namespace === "semantic" ? "Semantic" : s.namespace === "episodic" ? "Episodic" : "Procedural"));
        }
        const refs = extractFileRefs(reply);
        if (refs.length > 0) loadFileInViewer(refs[0].path, refs[0].line);
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setIsWorking(false);
    }
  }, [chatInput, isWorking, conversationId, messages, addLog, addMemory, staggerLogs, loadFileInViewer]);

  const savePreference = useCallback(() => {
    if (!prefInput.trim()) return;
    addMemory("Mentor rule", prefInput, "Guidance");
    fetch("/api/moorcheh/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: prefInput, type: "preference" }) }).catch(() => {});
    setPrefInput("");
    setShowPrefs(false);
    addLog("Mentor rule stored.", "success");
  }, [prefInput, addMemory, addLog]);

  if (!mounted) return null;

  const codeLines = codeFile?.content.split("\n") || [];

  const logColor = (type: LogType) =>
    type === "error" ? "#ef4444" : type === "success" ? C.accent : type === "system" ? C.purple : type === "warning" ? C.amber : C.muted;
  const logPrefix = (type: LogType) =>
    type === "system" ? ">>>" : type === "success" ? " +" : type === "error" ? " !" : type === "warning" ? " ~" : " >";

  return (
    <div className="rev-page" style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }} suppressHydrationWarning>
      {/* Noise grid overlay */}
      <div className="rev-noise" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />

      {/* Header */}
      <header style={{ flexShrink: 0, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `1px solid ${C.border}`, background: "rgba(5,5,5,0.9)", backdropFilter: "blur(24px)", position: "relative", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" className="flex items-center gap-2.5 font-ui-mono text-xs tracking-[-0.28px] uppercase" style={{ color: C.text, textDecoration: "none" }}>
            <span className="flex size-6 items-center justify-center bg-white text-black" style={{ borderRadius: 0 }}>
              <BrainCircuit size={14} />
            </span>
            <span style={{ fontWeight: 500 }}>REVENANT</span>
          </Link>
          <div style={{ width: 1, height: 18, background: C.border }} />

          {/* Pipeline status */}
          <div className="rev-pill" style={{ padding: "0.3rem 0.6rem", fontSize: "0.65rem", border: `1px solid ${pipelinePhase === "live" ? C.borderAccent : C.border}`, borderRadius: 0 }}>
            {pipelinePhase === "live" ? (
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: "0.4rem", height: "0.4rem", borderRadius: 999, background: C.accent, boxShadow: `0 0 12px ${C.accentGlow}`, display: "block" }} />
            ) : pipelinePhase ? (
              <span style={{ width: 10, height: 10, borderRadius: "50%", border: `1.5px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "block" }} />
            ) : (
              <span style={{ width: "0.4rem", height: "0.4rem", borderRadius: 999, background: "rgba(255,255,255,0.2)", display: "block" }} />
            )}
            {pipelinePhase === "init" ? "INITIALIZING" : pipelinePhase === "memory" ? "LOADING MEMORY" : pipelinePhase === "avatar" ? "CONNECTING" : pipelinePhase === "live" ? "SESSION LIVE" : "OFFLINE"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setShowPrefs(!showPrefs)} title="Mentor rules" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${showPrefs ? C.borderAccent : C.border}`, background: showPrefs ? "rgba(255,178,93,0.08)" : "transparent", color: showPrefs ? C.accent : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
            <Settings style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={() => setSidebarOpen((v) => !v)} title="Toggle sidebar" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${sidebarOpen ? C.borderAccent : C.border}`, background: sidebarOpen ? "rgba(255,178,93,0.08)" : "transparent", color: sidebarOpen ? C.accent : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
            <Activity style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", minHeight: 0, gap: 10, padding: 10, position: "relative", zIndex: 10 }}>
        {/* Left: Avatar + sources + input */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {/* Avatar */}
          <div className="rev-card" style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 0, borderRadius: 0 }}>
            {tavusUrl ? (
              <iframe src={tavusUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="microphone; camera; display-capture; autoplay" />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <div style={{ position: "relative", width: 72, height: 72 }}>
                  <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 3, repeat: Infinity, ease }} style={{ position: "absolute", inset: -24, background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`, borderRadius: "50%" }} />
                  <Image src="/logo.png" alt="" width={72} height={72} style={{ objectFit: "contain", opacity: 0.12, filter: "grayscale(1) brightness(2)" }} />
                </div>
                <p className="font-ui-mono" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: C.muted }}>
                  {pipelinePhase === "init" ? "INITIALIZING PIPELINE" : pipelinePhase === "memory" ? "LOADING FOUNDER MEMORY" : pipelinePhase === "avatar" ? "CONNECTING AVATAR" : "WAITING"}
                </p>
                {tavusError && (
                  <>
                    <p className="font-ui-mono" style={{ fontSize: 11, color: "rgba(239,68,68,0.6)" }}>{tavusError}</p>
                    <button onClick={startConversation} className="rev-pill" style={{ cursor: "pointer", color: C.accent, borderColor: C.borderAccent, marginTop: 8, borderRadius: 0 }}>RETRY</button>
                  </>
                )}
              </div>
            )}

            {/* Prefs overlay */}
            <AnimatePresence>
              {showPrefs && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.3, ease }} style={{ position: "absolute", bottom: 14, left: 14, right: 14, padding: "20px", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(32px)", border: `1px solid ${C.borderAccent}`, zIndex: 60 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles style={{ width: 13, height: 13, color: C.accent }} />
                      <span className="font-ui-mono" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.text }}>MENTOR RULES</span>
                    </div>
                    <button onClick={() => setShowPrefs(false)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}><X style={{ width: 13, height: 13 }} /></button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={prefInput} onChange={(e) => setPrefInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && savePreference()} placeholder="How should the founder respond..." className="font-ui-mono" style={{ flex: 1, padding: "8px 12px", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.text, fontSize: 12, outline: "none" }} />
                    <button onClick={savePreference} className="font-ui-mono" style={{ padding: "8px 16px", background: C.accent, color: "#050505", fontWeight: 600, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>SAVE</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cited sources */}
          <AnimatePresence>
            {citedSources.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ flexShrink: 0, border: `1px solid ${C.border}`, background: "rgba(15,15,15,0.72)", overflow: "hidden", backdropFilter: "blur(16px)" }}>
                <div style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: `1px solid ${C.border}` }}>
                  <BookOpen style={{ width: 10, height: 10, color: C.accent }} />
                  <span className="font-ui-mono" style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent }}>SOURCES</span>
                  <button onClick={() => setCitedSources([])} style={{ marginLeft: "auto", background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}><X style={{ width: 10, height: 10 }} /></button>
                </div>
                <div style={{ padding: "6px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
                  {citedSources.map((s) => (
                    <div key={s.id} style={{ flexShrink: 0, padding: "5px 9px", border: `1px solid ${C.border}`, background: C.surface, maxWidth: 190, cursor: "pointer" }}
                      onClick={() => { if (s.source_ref) { const m = s.source_ref.match(/(?:src|backend|tools)\/[\w/.-]+/); if (m) loadFileInViewer(m[0]); } }}>
                      <span className="font-ui-mono" style={{ fontSize: 8, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: s.namespace === "semantic" ? C.purple : s.namespace === "episodic" ? C.green : C.amber }}>{s.namespace}</span>
                      <p className="font-ui-mono" style={{ fontSize: 9, color: C.muted, lineHeight: 1.3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: `1px solid ${C.border}`, background: "rgba(15,15,15,0.72)", backdropFilter: "blur(16px)" }}>
            <motion.span animate={isWorking ? { scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] } : {}} transition={{ duration: 1, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: 999, background: isWorking ? C.accent : "rgba(255,255,255,0.15)", flexShrink: 0, boxShadow: isWorking ? `0 0 10px ${C.accentGlow}` : "none" }} />
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask why a decision was made, paste a GitHub URL, or request the story behind a tradeoff..."
              className="font-ui-mono"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: C.text, minWidth: 0 }}
            />
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button onClick={handleSend} disabled={!chatInput.trim() || isWorking} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${chatInput.trim() && !isWorking ? C.borderAccent : C.border}`, background: chatInput.trim() && !isWorking ? "rgba(255,178,93,0.08)" : "transparent", color: chatInput.trim() && !isWorking ? C.accent : C.muted, cursor: chatInput.trim() && !isWorking ? "pointer" : "not-allowed", opacity: isWorking ? 0.5 : 1, transition: "all 0.2s" }}>
                {isWorking ? <span style={{ width: 10, height: 10, borderRadius: "50%", border: `1.5px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "block" }} /> : <Send style={{ width: 13, height: 13 }} />}
              </button>
              <button onClick={() => setIsListening((v) => !v)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isListening ? "rgba(239,68,68,0.3)" : C.border}`, background: isListening ? "rgba(239,68,68,0.08)" : "transparent", color: isListening ? "#ef4444" : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
                {isListening ? <MicOff style={{ width: 13, height: 13 }} /> : <Mic style={{ width: 13, height: 13 }} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 390, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 30 }} style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, overflow: "hidden" }}>
              <div style={{ width: 390, height: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Tabs */}
                <div style={{ flexShrink: 0, display: "flex", gap: 2, padding: 2, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                  {(["terminal", "memory", "code"] as SidebarTab[]).map((tab) => (
                    <button key={tab} onClick={() => setSidebarTab(tab)} className="font-ui-mono" style={{ flex: 1, padding: "8px 0", border: `1px solid ${sidebarTab === tab ? C.borderAccent : "transparent"}`, background: sidebarTab === tab ? "rgba(255,178,93,0.06)" : "transparent", color: sidebarTab === tab ? C.accent : C.muted, fontWeight: 500, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      {tab === "terminal" ? <><Radio style={{ width: 10, height: 10 }} />PIPELINE</> : tab === "memory" ? <><Brain style={{ width: 10, height: 10 }} />MEMORY</> : <><Code2 style={{ width: 10, height: 10 }} />CODE</>}
                    </button>
                  ))}
                </div>

                {/* Panel */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", border: `1px solid ${C.border}`, background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", backdropFilter: "blur(16px)", overflow: "hidden", minHeight: 0 }}>
                  <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="font-ui-mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.mutedStrong }}>
                      {sidebarTab === "terminal" ? "PIPELINE LOG" : sidebarTab === "memory" ? "MEMORY RECALL" : codeFile ? codeFile.path.toUpperCase() : "CODE VIEWER"}
                    </span>
                    {isWorking && (
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} className="font-ui-mono" style={{ fontSize: 9, color: C.accent, letterSpacing: "0.12em" }}>PROCESSING</motion.span>
                    )}
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: sidebarTab === "code" ? 0 : "10px 14px" }}>
                    {sidebarTab === "terminal" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <AnimatePresence initial={false}>
                          {logs.map((log) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, ease }}
                              className="font-ui-mono"
                              style={{ display: "flex", gap: 6, fontSize: 10, color: logColor(log.type), lineHeight: 1.7, padding: "1px 0" }}
                            >
                              <span style={{ opacity: 0.3, flexShrink: 0, fontSize: 9 }}>{log.timestamp}</span>
                              <span style={{ opacity: 0.5, flexShrink: 0, width: 20, textAlign: "right" }}>{logPrefix(log.type)}</span>
                              <span style={{ flex: 1, wordBreak: "break-word" }}>{log.text}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={logsEnd} />
                      </div>
                    ) : sidebarTab === "memory" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <AnimatePresence initial={false}>
                          {memory.map((item) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} style={{ padding: "10px 12px", border: `1px solid ${C.border}`, background: C.surface }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                                <span className="font-ui-mono" style={{ fontSize: 8, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: item.cluster === "Semantic" ? C.purple : item.cluster === "Episodic" ? C.green : item.cluster === "Procedural" ? C.amber : C.accent }}>{item.cluster}</span>
                                {item.strength !== undefined && (
                                  <span className="font-ui-mono" style={{ fontSize: 9, color: C.muted }}>{(item.strength * 100).toFixed(0)}%</span>
                                )}
                              </div>
                              <p className="font-ui-mono" style={{ fontSize: 10, fontWeight: 500, color: C.text, marginBottom: 2 }}>{item.title}</p>
                              <p className="font-ui-mono" style={{ fontSize: 9, color: C.muted, lineHeight: 1.5 }}>{item.excerpt}</p>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={memoryEnd} />
                      </div>
                    ) : (
                      <div className="font-ui-mono" style={{ fontSize: 10, lineHeight: 1.6 }}>
                        {codeLoading ? (
                          <div style={{ padding: 20, textAlign: "center", color: C.muted }}>
                            <span style={{ width: 14, height: 14, margin: "0 auto 8px", display: "block", borderRadius: "50%", border: `1.5px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                            LOADING
                          </div>
                        ) : codeFile ? (
                          codeLines.map((line, i) => {
                            const lineNum = i + 1;
                            const isHL = codeFile.highlightLines?.includes(lineNum);
                            return (
                              <div key={i} style={{ display: "flex", background: isHL ? "rgba(255,178,93,0.08)" : "transparent", borderLeft: isHL ? `2px solid ${C.accent}` : "2px solid transparent", padding: "0 10px", minHeight: 16 }}>
                                <span style={{ width: 32, flexShrink: 0, color: isHL ? C.accent : "rgba(255,255,255,0.1)", textAlign: "right", paddingRight: 10, userSelect: "none", fontSize: 9 }}>{lineNum}</span>
                                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", color: C.text }}>{highlightLine(line)}</pre>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: 28, textAlign: "center", color: C.muted }}>
                            <FileText style={{ width: 24, height: 24, margin: "0 auto 8px", opacity: 0.2 }} />
                            <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>NO FILE LOADED</p>
                            <p style={{ fontSize: 9, marginTop: 4, opacity: 0.5 }}>Files referenced in responses load here.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ flexShrink: 0, padding: "7px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 5 }}>
                    <motion.span animate={pipelinePhase === "live" ? { opacity: [0.3, 1, 0.3] } : {}} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: 999, background: pipelinePhase === "live" ? C.accent : "rgba(255,255,255,0.15)", display: "block", boxShadow: pipelinePhase === "live" ? `0 0 8px ${C.accentGlow}` : "none" }} />
                    <span className="font-ui-mono" style={{ fontSize: 8, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      {sidebarTab === "code" && codeFile ? codeFile.path : pipelinePhase === "live" ? "MEMORY PIPELINE ACTIVE" : "WAITING"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
