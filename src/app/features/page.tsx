"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { Brain, BookOpen, MessageSquareQuote, Shield, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Brain,
    title: "It watches how great engineers work",
    desc: "Revenent learns from real engineering behavior instead of asking teams to keep brittle documentation perfectly maintained.",
  },
  {
    icon: BookOpen,
    title: "It turns judgment into company memory",
    desc: "The best patterns do not stay trapped in one person's head. They become something the whole company can keep and reuse.",
  },
  {
    icon: Users,
    title: "It compounds team intelligence",
    desc: "Every strong engineer can make the future team better because their best habits feed a living memory instead of disappearing.",
  },
  {
    icon: MessageSquareQuote,
    title: "It preserves legendary people as mentors",
    desc: "When a founder or senior engineer leaves, their knowledge can live on as an interactive guide junior engineers can actually talk to.",
  },
  {
    icon: Shield,
    title: "It protects institutional memory from attrition",
    desc: "The point is simple: when key people leave, the company should not lose the reasoning that shaped the product and codebase.",
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ background: "#0c0905", minHeight: "100vh", color: "#e8e0d0" }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 32px 100px" }}>
        <div style={{ marginBottom: 72 }}>
          <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "#d97706", marginBottom: 16 }}>The story</span>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia)", fontStyle: "italic", fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.1, marginBottom: 20 }}>
            Revenent is about
            <br />
            <span style={{ color: "#d97706" }}>preserving what makes a team great</span>.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "#6b6456", maxWidth: 760 }}>
            Keep the message simple: Revenent learns from your engineers, builds living company memory,
            and lets founder-level judgment remain available even after key people leave.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{ padding: "32px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", transition: "border-color 0.2s" }}
              onMouseEnter={(event) => (event.currentTarget.style.borderColor = "rgba(217,119,6,0.3)")}
              onMouseLeave={(event) => (event.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <feature.icon style={{ width: 20, height: 20, color: "#d97706" }} />
              </div>
              <h3 style={{ fontFamily: "var(--font-playfair, Georgia)", fontStyle: "italic", fontSize: 20, marginBottom: 12 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#6b6456" }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 72, display: "flex", alignItems: "center", gap: 20, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/tech-stack" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: 999, background: "#d97706", color: "#0c0905", fontWeight: 800, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", whiteSpace: "nowrap" }}>
            How it works <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
          <span style={{ fontSize: 14, color: "#3a342a" }}>The implementation matters, but the message should stay human.</span>
        </div>
      </main>
    </div>
  );
}
