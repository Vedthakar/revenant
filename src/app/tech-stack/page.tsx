"use client";

import React from "react";
import Navbar from "@/components/Navbar";

const steps = [
  {
    title: "Revenent watches how engineers work",
    desc: "It learns from the work already happening across the team instead of depending on people to remember to write everything down.",
  },
  {
    title: "It distills what makes people effective",
    desc: "Strong patterns are turned into living company memory so the next engineer can inherit real judgment, not just static notes.",
  },
  {
    title: "It keeps founder-level knowledge alive",
    desc: "When a key person leaves, their reasoning, stories, and decision style can remain available as an AI mentor.",
  },
  {
    title: "Juniors can ask the mentor directly",
    desc: "The experience is simple: ask why a decision was made, and get back the reasoning, the context, and the story behind it.",
  },
];

export default function TechStackPage() {
  return (
    <div style={{ background: "#0c0905", minHeight: "100vh", color: "#e8e0d0" }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "120px 32px 100px" }}>
        <div style={{ marginBottom: 64 }}>
          <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "#d97706", marginBottom: 16 }}>How it works</span>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia)", fontStyle: "italic", fontSize: "clamp(38px, 5vw, 60px)", lineHeight: 1.1, marginBottom: 20 }}>
            The idea is simple,
            <br />
            <span style={{ color: "#d97706" }}>the impact is not</span>.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "#6b6456", maxWidth: 720 }}>
            Revenent does not need a long technical pitch on the surface. What matters is that it learns from great engineers,
            keeps their judgment alive, and makes that judgment available to the people who come after them.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((step, index) => (
            <div key={step.title} style={{ padding: "28px 32px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#d97706", letterSpacing: "0.2em", textTransform: "uppercase", paddingTop: 2 }}>
                  0{index + 1}
                </span>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{step.title}</h2>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "#6b6456" }}>{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
