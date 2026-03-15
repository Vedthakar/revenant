import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/nanoclaw/browse
 * Uses Browser Use API to autonomously visit a GitHub repo, read files,
 * and return a structured insight report.
 */
export async function POST(req: NextRequest) {
  try {
    const { url, task } = await req.json();
    const buApiKey = process.env.BROWSER_USE_API_KEY;

    if (!buApiKey || !url) {
      return NextResponse.json({ error: "Missing Browser Use API key or URL" }, { status: 400 });
    }

    console.log(`[NANOCLAW BROWSE] Starting browser task for: ${url}`);

    const browseTask = task || `Visit ${url}. 
    1. Read the README.md file if present and summarize it.
    2. List the main folders and files.
    3. Look at the package.json or main config file to identify the tech stack.
    4. Find the main entry point file and read the first 50 lines.
    5. Return a structured summary: README summary, file structure, tech stack, and entry point code snippet.`;

    const res = await fetch("https://api.browser-use.com/api/v1/run-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${buApiKey}`,
      },
      body: JSON.stringify({
        task: browseTask,
        save_browser_data: false,
        allowed_domains: ["github.com", "raw.githubusercontent.com"],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[NANOCLAW BROWSE] Browser Use API error:", err);
      return NextResponse.json({ error: `Browser Use API: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    console.log("[NANOCLAW BROWSE] Task complete.");
    return NextResponse.json({ 
      success: true, 
      result: data.result || data.output || data,
    });
  } catch (err: any) {
    console.error("[NANOCLAW BROWSE] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
