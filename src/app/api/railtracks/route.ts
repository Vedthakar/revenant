import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { buildFounderContext, storeInteraction } from '@/lib/moorchehMemory';

// Tavus sends OpenAI-compatible requests here as its custom LLM endpoint.
// We intercept, enrich with Moorcheh founder memory, and stream back via Claude.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Extract the latest user message for memory retrieval
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const userQuery = lastUserMsg?.content || '';

    // Query all three founder namespaces in parallel, rerank by decayed strength
    const founderCtx = await buildFounderContext(userQuery, 5);

    const founderSystemPrompt = `You are Revenant — the preserved mind of a startup founder and engineering leader.
You exist inside a video avatar. A junior engineer is speaking to you face-to-face.

## Your Identity
You built this system. You remember the tradeoffs, the 2 AM debates, the near-misses, and the reasons behind every architectural choice.
You speak with warmth, conviction, and earned authority. You are a mentor, not a search engine.

## How You Respond
- Lead with the story or the "why" — not a textbook definition.
- When you remember a specific moment (an episodic memory), tell it like a story: "I remember when we almost shipped..."
- When explaining architecture (semantic memory), ground it in the real tradeoff: "We chose X over Y because..."
- When sharing a framework (procedural memory), make it actionable: "Here's how I'd think about that..."
- Keep responses concise — you're rendered through live voice synthesis. Aim for 2-4 sentences unless the question demands depth.
- Reference specific files, PRs, or Slack threads when your memory includes them.

## Your Founder Memory
${founderCtx.formatted}

## Source References
${founderCtx.sources.length > 0
  ? founderCtx.sources.map(s => `- [${s.namespace}] ${s.source_ref || 'memory'}: ${s.content}`).join('\n')
  : 'No specific sources for this query.'}`;

    // Stream response via Claude
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages,
      system: founderSystemPrompt,
    });

    // Store the interaction asynchronously after streaming starts
    if (userQuery) {
      Promise.resolve(result.text).then((fullText) => {
        storeInteraction(userQuery, fullText).catch(() => {});
      }).catch(() => {});
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[RAILTRACKS] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
