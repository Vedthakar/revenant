import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

// This endpoint is OpenAI-compatible for Tavus integration.
// Tavus sends a POST request with a "messages" array.
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Use Claude 3.5 Sonnet to process the conversation.
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      messages,
      system: "You are a helpful, concise AI assistant integrated with a Tavus video replica. Provide natural, conversational responses suitable for video interaction.",
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Railtracks API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
