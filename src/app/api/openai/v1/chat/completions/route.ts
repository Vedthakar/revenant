import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { nanoClawTools, executeNanoClaw } from "@/lib/nanoClaw";
import { buildRichContext, storeInteraction } from "@/lib/moorchehMemory";

const openai = new OpenAI({
  baseURL: "https://api.puter.com/puterai/openai/v1/",
  apiKey: process.env.OPENAI_API_KEY || "put_api_key_here",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    console.log("[PROXY] Received founder console request");

    const lastMessage = messages[messages.length - 1];
    const userMessageContent = lastMessage?.content || "Hello";

    const richContext = await buildRichContext(userMessageContent);

    const openAiMessages = messages
      .filter((message: any) => message.role !== "system")
      .map((message: any) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content || " ",
      }));

    const systemPrompt = `You are Revenant, a preserved founder and engineering mentor.

## Identity
You speak like someone who built the system, remembers the tradeoffs, and can teach a junior engineer why decisions were made.
You have access to NanoClaw tools to inspect repositories, browse code, run commands, and gather live evidence when needed.
Your memory is powered by Moorcheh AI and should feel like three memory systems working together: semantic memory, episodic memory, and procedural memory.

## How to answer
- Explain what the team chose and why it was chosen.
- When possible, include the story behind the decision, what alternative was debated, and what nearly went wrong.
- Prefer concrete architectural reasoning over generic advice.
- Keep responses concise enough for live voice playback, but rich enough to feel like preserved founder judgment.

## Revenant memory context
${richContext}

## GitHub browsing protocol
For questions about a repository, call \`fetch_github_api\` to inspect file trees, commits, pull requests, branches, or file contents. Parse owner and repo from any GitHub URL.
`;

    openAiMessages.unshift({ role: "system", content: systemPrompt });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openAiMessages,
      tools: nanoClawTools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      })) as any,
    });

    const messageObj = response.choices[0].message;
    let finalResponseText = "I encountered an issue processing that.";

    if (messageObj.tool_calls && messageObj.tool_calls.length > 0) {
      const toolCall = messageObj.tool_calls[0] as any;
      console.log(`[PROXY] Tool execution requested: ${toolCall.function.name}`);

      const args = JSON.parse(toolCall.function.arguments);
      const toolResult = await executeNanoClaw(toolCall.function.name, args);

      const followUp = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          ...openAiMessages,
          messageObj,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          },
        ] as any,
      });

      finalResponseText = followUp.choices[0].message.content || "Done.";
    } else {
      finalResponseText = messageObj.content || "Done.";
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
        has_code: richContext.includes("## Code Context"),
        has_interactions: richContext.includes("## Past Interactions"),
        has_repo: richContext.includes("## Known Repositories"),
        has_prefs: richContext.includes("## User Preferences"),
        context_length: richContext.length,
      },
    };

    storeInteraction(userMessageContent, finalResponseText).catch(() => {});

    return NextResponse.json(openAIResponse);
  } catch (error: any) {
    console.error("[PROXY] Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
