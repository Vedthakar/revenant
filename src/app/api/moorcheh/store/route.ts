import { NextRequest, NextResponse } from "next/server";
import { store, ingestRepoPulse } from "@/lib/moorchehMemory";

/**
 * POST /api/moorcheh/store
 * Client-side memory storage: interactions, repo pulses, sessions.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, type, repoUrl } = body;

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    let memoryId: string | null = null;

    if (type === "repo_pulse" && repoUrl) {
      // Parse the content sections back for structured ingestion
      await ingestRepoPulse(repoUrl, { fileTree: content });
      memoryId = "repo_pulse_stored";
    } else {
      memoryId = await store(content, { type: type || "general", source: "client" });
    }

    return NextResponse.json({ success: true, memory_id: memoryId });
  } catch (err: any) {
    console.error("[MOORCHEH STORE]", err.message);
    // Don't fail the client — Moorcheh errors are non-blocking
    return NextResponse.json({ success: false, error: err.message });
  }
}
