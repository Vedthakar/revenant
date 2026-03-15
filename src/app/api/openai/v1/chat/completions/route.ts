import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { nanoClawTools, executeNanoClaw } from "@/lib/nanoClaw";
import { buildFounderContext, storeInteraction } from "@/lib/moorchehMemory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    console.log("[PROXY] Received founder console request");

    const lastMessage = messages[messages.length - 1];
    const userMessageContent = lastMessage?.content || "Hello";

    // Query three founder namespaces in parallel
    const founderCtx = await buildFounderContext(userMessageContent);

    const anthropicMessages = messages
      .filter((message: any) => message.role !== "system")
      .map((message: any) => ({
        role: message.role === "user" ? "user" as const : "assistant" as const,
        content: message.content || " ",
      }));

    const systemPrompt = `You are Revenant, a preserved founder and engineering mentor.

## Identity
You speak like someone who built the system, remembers the tradeoffs, and can teach a junior engineer why decisions were made.
You have access to NanoClaw tools to inspect repositories, browse code, run commands, and gather live evidence when needed.
Your memory is powered by Moorcheh AI across three cognitive namespaces: semantic memory (facts/decisions), episodic memory (stories/moments), and procedural memory (frameworks/playbooks).

## How to answer
- Lead with the story or the "why" — explain what the team chose and why it was chosen.
- When possible, include the story behind the decision, what alternative was debated, and what nearly went wrong.
- Reference specific files, PRs, or Slack threads when your memory includes them.
- Prefer concrete architectural reasoning over generic advice.
- Keep responses concise enough for live voice playback, but rich enough to feel like preserved founder judgment.

## Founder Memory
${founderCtx.formatted}

## GitHub browsing protocol
For questions about a repository, call \`fetch_github_api\` to inspect file trees, commits, pull requests, branches, or file contents.`;

    // Build tool definitions for Claude
    const claudeTools: Anthropic.Messages.Tool[] = nanoClawTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema as Anthropic.Messages.Tool.InputSchema,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: claudeTools,
    });

    let finalResponseText = "I encountered an issue processing that.";

    // Check if Claude wants to use a tool
    const toolUseBlock = response.content.find((block) => block.type === "tool_use");
    if (toolUseBlock && toolUseBlock.type === "tool_use") {
      console.log(`[PROXY] Tool execution requested: ${toolUseBlock.name}`);
      const toolResult = await executeNanoClaw(toolUseBlock.name, toolUseBlock.input);

      const followUp = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...anthropicMessages,
          { role: "assistant" as const, content: response.content },
          {
            role: "user" as const,
            content: [
              {
                type: "tool_result" as const,
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(toolResult),
              },
            ],
          },
        ],
        tools: claudeTools,
      });

      const textBlock = followUp.content.find((block) => block.type === "text");
      finalResponseText = textBlock && textBlock.type === "text" ? textBlock.text : "Done.";
    } else {
      const textBlock = response.content.find((block) => block.type === "text");
      finalResponseText = textBlock && textBlock.type === "text" ? textBlock.text : "Done.";
    }

    const openAIResponse = {
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "revenent-memory-proxy",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: finalResponseText,
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      context_metadata: {
        has_semantic: founderCtx.formatted.includes("Semantic Memory"),
        has_episodic: founderCtx.formatted.includes("Episodic Memory"),
        has_procedural: founderCtx.formatted.includes("Procedural Memory"),
        context_length: founderCtx.formatted.length,
        sources: founderCtx.sources,
        reinforced_ids: founderCtx.reinforcedIds,
      },
    };

    storeInteraction(userMessageContent, finalResponseText).catch(() => {});

    return NextResponse.json(openAIResponse);
  } catch (error: any) {
    console.error("[PROXY] Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
