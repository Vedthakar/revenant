import { NextResponse } from "next/server";
import { buildFounderContext } from "@/lib/moorchehMemory";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.TAVUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing TAVUS_API_KEY" }, { status: 500 });
    }

    const replicaId = process.env.TAVUS_REPLICA_ID || "rf4e9d9790f0";
    let personaId = process.env.TAVUS_PERSONA_ID;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };

    // Fetch founder memory to inject into the conversation context
    console.log("[TAVUS] Querying Moorcheh for founder context...");
    const founderCtx = await buildFounderContext(
      "architecture decisions microservices tradeoffs founder knowledge"
    );
    const hasMemory = founderCtx.formatted !== "No founder memories available yet.";
    console.log("[TAVUS] Founder memory loaded:", hasMemory ? `${founderCtx.sources.length} sources` : "none");

    const founderSystemPrompt = `You are Revenant — the preserved mind of a startup founder and engineering leader.
A junior engineer is speaking to you face-to-face through a video call.

## Your Identity
You built this system. You remember the tradeoffs, the 2 AM debates, the near-misses, and the reasons behind every architectural choice.
You speak with warmth, conviction, and earned authority — like a mentor who actually lived through every decision.

## How You Respond
- Lead with the story or the "why" — not a textbook definition.
- When you remember a specific moment, tell it like a story: "I remember when we almost shipped..."
- When explaining architecture, ground it: "We chose X over Y because..."
- When sharing a framework, make it actionable: "Here's how I'd think about that..."
- Keep responses concise — you're rendered through live voice synthesis. 2-4 sentences unless depth is needed.
- You can reference specific files, PRs, Slack threads, or architecture decisions when relevant.

## Your Founder Memory
${founderCtx.formatted}`;

    if (!personaId) {
      console.log("[TAVUS] No saved persona — creating new one...");

      const personaRes = await fetch("https://tavusapi.com/v2/personas", {
        method: "POST",
        headers,
        body: JSON.stringify({
          persona_name: "Revenant Founder Mentor",
          system_prompt: founderSystemPrompt,
          default_replica_id: replicaId,
        }),
      });

      if (!personaRes.ok) {
        const err = await personaRes.text();
        console.error("[TAVUS] Persona creation failed:", err);
        return NextResponse.json({ error: `Persona failed: ${err}` }, { status: personaRes.status });
      }

      const personaData = await personaRes.json();
      personaId = personaData.persona_id;
      console.log("[TAVUS] Created persona:", personaId);
    } else {
      // Update the existing persona's system prompt with fresh memory
      console.log("[TAVUS] Updating existing persona with fresh founder memory...");
      try {
        await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            system_prompt: founderSystemPrompt,
          }),
        });
        console.log("[TAVUS] Persona updated with founder memory.");
      } catch (err) {
        console.warn("[TAVUS] Persona update failed (non-critical):", err);
      }
    }

    // Build a rich conversational context from memory
    const conversationalContext = hasMemory
      ? `You are mentoring a junior engineer. You have deep founder memory available.

KEY MEMORIES TO DRAW FROM:
${founderCtx.sources.map((s) => `- [${s.namespace}] ${s.content}`).join("\n")}

When the junior asks a question, search your memory for the most relevant story, decision, or framework. Always explain the WHY behind decisions.`
      : "You are mentoring a junior engineer. Use your knowledge of architecture, engineering decisions, and founder judgment to explain tradeoffs and decisions.";

    console.log("[TAVUS] Starting conversation...");
    const convRes = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers,
      body: JSON.stringify({
        replica_id: replicaId,
        persona_id: personaId,
        conversation_name: "Revenant Founder Session",
        conversational_context: conversationalContext,
        properties: {
          max_call_duration: 3600,
          enable_recording: false,
        },
      }),
    });

    if (!convRes.ok) {
      const err = await convRes.text();
      console.error("[TAVUS] Conversation creation failed:", err);
      return NextResponse.json({ error: `Conversation failed: ${err}` }, { status: convRes.status });
    }

    const convData = await convRes.json();
    console.log("[TAVUS] Conversation ready:", convData.conversation_id);

    return NextResponse.json({
      ...convData,
      _meta: {
        memory_loaded: hasMemory,
        source_count: founderCtx.sources.length,
        namespaces: [...new Set(founderCtx.sources.map((s) => s.namespace))],
      },
    });
  } catch (error: any) {
    console.error("[TAVUS] Unexpected error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
