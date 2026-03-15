"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mic, MicOff, Send, Settings, Terminal, Database, Sparkles, ChevronRight, Activity, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type LogType = "info" | "success" | "warning" | "error";
type SidebarTab = "terminal" | "memory";

interface LogItem { id: number; text: string; type: LogType; }
interface MemoryItem { id: number; title: string; excerpt: string; cluster: string; }

const C = {
  bg: "#0c0905",
  surface: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.07)",
  borderGold: "rgba(217,119,6,0.25)",
  gold: "#d97706",
  muted: "#6b6456",
  text: "#e8e0d0",
};

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

  const [logs, setLogs] = useState<LogItem[]>([
    { id: 1, text: "REVENENT founder session initialized.", type: "info" },
    { id: 2, text: "Moorcheh multi-memory recall online.", type: "success" },
    { id: 3, text: "Founder mentor channel standing by.", type: "success" },
  ]);
  const [memory, setMemory] = useState<MemoryItem[]>([
    { id: 1, title: "Semantic memory", excerpt: "Architecture decisions and technical conventions are available for retrieval.", cluster: "Semantic" },
    { id: 2, title: "Procedural memory", excerpt: "Decision frameworks and founder heuristics are loaded into live recall.", cluster: "Procedural" },
    { id: 3, title: "Episodic memory", excerpt: "Narrative moments, near-misses, and pivotal tradeoffs can be surfaced in context.", cluster: "Episodic" },
  ]);

  const logsEnd = useRef<HTMLDivElement>(null);
  const memoryEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const addLog = useCallback((text: string, type: LogType = "info") => {
    setLogs((previous) => [...previous, { id: Date.now() + Math.random(), text, type }]);
  }, []);

  const addMemory = useCallback((title: string, excerpt: string, cluster: string) => {
    setMemory((previous) => [{ id: Date.now() + Math.random(), title, excerpt, cluster }, ...previous]);
  }, []);

  useEffect(() => { logsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { memoryEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [memory]);

  const startConversation = useCallback(async () => {
    try {
      addLog("Connecting founder avatar session...", "info");
      const response = await fetch("/api/tavus", { method: "POST" });
      const data = await response.json();
      if (response.status === 402) {
        setTavusError("402: Credits required");
        addLog("Founder avatar connection needs more credits.", "error");
        return;
      }
      if (data.conversation_url) {
        setTavusUrl(data.conversation_url);
        setConversationId(data.conversation_id);
        addLog(`Founder session live: ${data.conversation_id?.slice(0, 8)}`, "success");
      } else {
        setTavusError(data.error || "Unknown error");
        addLog(`Founder session failed: ${data.error}`, "error");
      }
    } catch (error: any) {
      setTavusError(error.message);
      addLog(`Connection error: ${error.message}`, "error");
    }
  }, [addLog]);

  useEffect(() => {
    if (mounted) {
      startConversation();
    }
  }, [mounted, startConversation]);

  const GITHUB = /https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)/;

  const handleSend = useCallback(async () => {
    const question = chatInput.trim();
    if (!question || isWorking) return;
    setChatInput("");

    const repoMatch = question.match(GITHUB);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      setSidebarOpen(true);
      setIsWorking(true);
      addLog(`Scouting repository context for ${owner}/${repo}`, "info");
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`).then((result) => result.json());
        const tree = Array.isArray(response)
          ? response.map((file: any) => `${file.type === "dir" ? "[dir]" : "[file]"} ${file.name}`).join("\n")
          : "";
        addLog("Repository context indexed successfully.", "success");
        addMemory("Repository context", `${owner}/${repo} is available for live founder recall.`, "Context");
        if (conversationId) {
          fetch("/api/tavus/inject-context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversation_id: conversationId,
              context: `Repository context for ${owner}/${repo}:\n${tree}`,
            }),
          }).catch(() => {});
        }
      } catch (error: any) {
        addLog(`Repository scout error: ${error.message}`, "error");
      } finally {
        setIsWorking(false);
      }
      return;
    }

    setSidebarOpen(true);
    setIsWorking(true);
    addLog(`Founder question received: ${question.slice(0, 60)}...`, "info");
    setMessages((previous) => [...previous, { role: "user", content: question }]);
    try {
      const response = await fetch("/api/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: question }] }),
      });
      const data = await response.json();
      if (data.choices?.[0]) {
        const reply = data.choices[0].message.content;
        addLog(`Founder response ready: ${reply.slice(0, 80)}...`, "success");
        setMessages((previous) => [...previous, { role: "assistant", content: reply }]);
        if (data.context_metadata) {
          addMemory("Retrieved memory", "Relevant founder and company memory were injected into this answer.", "Recall");
        }
      }
    } catch (error: any) {
      addLog(`Request failed: ${error.message}`, "error");
    } finally {
      setIsWorking(false);
    }
  }, [chatInput, isWorking, conversationId, messages, addLog, addMemory]);

  const savePreference = useCallback(() => {
    if (!prefInput.trim()) return;
    addMemory("Mentor rule", prefInput, "Guidance");
    fetch("/api/moorcheh/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: prefInput, type: "preference" }),
    }).catch(() => {});
    setPrefInput("");
    setShowPrefs(false);
    addLog("Founder mentoring preference saved to Moorcheh.", "success");
  }, [prefInput, addMemory, addLog]);

  if (!mounted) return null;

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.text, overflow: "hidden" }} suppressHydrationWarning>
      <div style={{ position: "fixed", top: "40%", left: "40%", width: 600, height: 600, background: "radial-gradient(circle, rgba(217,119,6,0.04) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />

      <header style={{ flexShrink: 0, height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${C.border}`, background: "rgba(12,9,5,0.9)", backdropFilter: "blur(24px)", position: "relative", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ position: "relative", width: 44, height: 44 }}>
              <Image src="/logo.png" alt="Revenent" fill style={{ objectFit: "contain" }} />
            </div>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase" }}>REVENENT</span>
          </Link>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "block", boxShadow: `0 0 8px ${C.gold}` }} />
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>Founder avatar session active</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowPrefs(!showPrefs)} title="Mentor rules" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: `1px solid ${showPrefs ? C.borderGold : C.border}`, background: showPrefs ? "rgba(217,119,6,0.1)" : "transparent", color: showPrefs ? C.gold : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
            <Settings style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => setSidebarOpen((value) => !value)} title="Toggle memory sidebar" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: `1px solid ${sidebarOpen ? C.borderGold : C.border}`, background: sidebarOpen ? "rgba(217,119,6,0.1)" : "transparent", color: sidebarOpen ? C.gold : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
            <Activity style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", minHeight: 0, gap: 16, padding: 16, position: "relative", zIndex: 10 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div style={{ flex: 1, borderRadius: 24, border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.4)", overflow: "hidden", position: "relative", minHeight: 0 }}>
            {tavusUrl ? (
              <iframe src={tavusUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="microphone; camera; display-capture; autoplay" />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <div style={{ position: "relative", width: 100, height: 100 }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)", borderRadius: "50%", animation: "pulse 3s infinite" }} />
                  <Image src="/logo.png" alt="" width={100} height={100} style={{ objectFit: "contain", opacity: 0.15, filter: "grayscale(1) brightness(2)" }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.muted }}>Establishing founder session</p>
                {tavusError && <p style={{ fontSize: 11, color: "rgba(239,68,68,0.5)", fontFamily: "monospace" }}>Error: {tavusError}</p>}
                <button onClick={startConversation} style={{ marginTop: 8, padding: "10px 24px", borderRadius: 999, border: `1px solid ${C.borderGold}`, background: "transparent", color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>Retry connection</button>
              </div>
            )}

            <AnimatePresence>
              {showPrefs && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ position: "absolute", bottom: 20, left: 20, right: 20, padding: "28px", borderRadius: 20, background: "rgba(12,9,5,0.95)", backdropFilter: "blur(32px)", border: `1px solid ${C.borderGold}`, zIndex: 60 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Sparkles style={{ width: 16, height: 16, color: C.gold }} />
                      <span style={{ fontFamily: "var(--font-playfair,Georgia)", fontStyle: "italic", fontSize: 18, color: C.text }}>Mentor rules</span>
                    </div>
                    <button onClick={() => setShowPrefs(false)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}>
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input value={prefInput} onChange={(event) => setPrefInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && savePreference()} placeholder="Define how the founder mentor should respond, explain tradeoffs, or tell stories..." style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.text, fontSize: 14, outline: "none" }} />
                    <button onClick={savePreference} style={{ padding: "12px 24px", borderRadius: 12, background: C.gold, color: "#0c0905", fontWeight: 800, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Save rule</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 18, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isWorking ? C.gold : C.border, flexShrink: 0, transition: "all 0.3s", boxShadow: isWorking ? `0 0 8px ${C.gold}` : "none" }} />
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
              placeholder="Ask why a decision was made, paste a GitHub URL, or request the story behind a tradeoff..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: C.text, minWidth: 0 }}
            />
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={handleSend} disabled={!chatInput.trim() || isWorking} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: `1px solid ${chatInput.trim() && !isWorking ? C.borderGold : C.border}`, background: chatInput.trim() && !isWorking ? "rgba(217,119,6,0.1)" : "transparent", color: chatInput.trim() && !isWorking ? C.gold : C.muted, cursor: chatInput.trim() && !isWorking ? "pointer" : "not-allowed", opacity: isWorking ? 0.5 : 1, transition: "all 0.2s" }}>
                {isWorking ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.gold}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} /> : <Send style={{ width: 16, height: 16 }} />}
              </button>
              <button onClick={() => setIsListening((value) => !value)} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: `1px solid ${isListening ? "rgba(239,68,68,0.4)" : C.border}`, background: isListening ? "rgba(239,68,68,0.1)" : "transparent", color: isListening ? "#ef4444" : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
                {isListening ? <MicOff style={{ width: 16, height: 16 }} /> : <Mic style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 30 }} style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, overflow: "hidden" }}>
              <div style={{ width: 380, height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ flexShrink: 0, display: "flex", gap: 4, padding: 4, borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.015)" }}>
                  {(["terminal", "memory"] as SidebarTab[]).map((tab) => (
                    <button key={tab} onClick={() => setSidebarTab(tab)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${sidebarTab === tab ? C.borderGold : "transparent"}`, background: sidebarTab === tab ? "rgba(217,119,6,0.1)" : "transparent", color: sidebarTab === tab ? C.gold : C.muted, fontWeight: 700, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}>
                      {tab === "terminal"
                        ? <><Terminal style={{ width: 13, height: 13, display: "inline", marginRight: 6, verticalAlign: "middle" }} />Session log</>
                        : <><Database style={{ width: 13, height: 13, display: "inline", marginRight: 6, verticalAlign: "middle" }} />Memory recall</>}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 20, border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.3)", overflow: "hidden", minHeight: 0 }}>
                  <div style={{ flexShrink: 0, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-playfair,Georgia)", fontStyle: "italic", fontSize: 16, color: C.text }}>
                      {sidebarTab === "terminal" ? "Founder session log" : "Memory recall"}
                    </span>
                    {isWorking && <span style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.15em" }}>PROCESSING</span>}
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                    {sidebarTab === "terminal" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {logs.map((log) => (
                          <div key={log.id} style={{ display: "flex", gap: 10, fontSize: 12, fontFamily: "monospace", color: log.type === "error" ? "#f87171" : log.type === "success" ? C.gold : C.muted, lineHeight: 1.5 }}>
                            <span style={{ opacity: 0.3, flexShrink: 0 }}>{">"}</span>
                            <span style={{ flex: 1, wordBreak: "break-word" }}>{log.text}</span>
                          </div>
                        ))}
                        <div ref={logsEnd} />
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {memory.map((item) => (
                          <div key={item.id} style={{ padding: "16px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold }}>{item.cluster}</span>
                              <ChevronRight style={{ width: 12, height: 12, color: C.muted }} />
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{item.title}</p>
                            <p style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", lineHeight: 1.5 }}>{item.excerpt}</p>
                          </div>
                        ))}
                        <div ref={memoryEnd} />
                      </div>
                    )}
                  </div>

                  <div style={{ flexShrink: 0, padding: "10px 20px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "block" }} />
                    <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>Founder memory link active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}`}</style>
    </div>
  );
}
