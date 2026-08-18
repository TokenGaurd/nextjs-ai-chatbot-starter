import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const maxDuration = 30;

/**
 * TokenGuard speaks the OpenAI wire format and forwards to whichever upstream
 * your credential belongs to, so the OpenAI provider works for every provider
 * TokenGuard supports — only the model id changes.
 */
const DEFAULT_MODEL = process.env.TOKEN_GUARD_MODEL ?? 'claude-haiku-4-5';

function missingConfig(): string | null {
  const key = process.env.TOKEN_GUARD_API_KEY;
  const base = process.env.TOKEN_GUARD_BASE_URL;
  if (!key || key.includes('your_key_here') || key.includes('your_actual_key')) {
    return 'TOKEN_GUARD_API_KEY is not set. Create a free proxy key at https://tokenguard.dev and put it in .env.local';
  }
  if (!base) return 'TOKEN_GUARD_BASE_URL is not set. Copy it from .env.example into .env.local';
  return null;
}

export async function POST(req: Request) {
  const problem = missingConfig();
  if (problem) {
    return Response.json({ error: problem }, { status: 500 });
  }

  const gateway = createOpenAI({
    apiKey: process.env.TOKEN_GUARD_API_KEY,
    baseURL: process.env.TOKEN_GUARD_BASE_URL,
  });

  const { messages, model }: { messages: UIMessage[]; model?: string } = await req.json();

  const result = streamText({
    // .chat() pins the /chat/completions endpoint. The bare `gateway(id)` call
    // would target OpenAI's newer /responses API, which the other upstreams
    // behind TokenGuard do not serve.
    model: gateway.chat(model ?? DEFAULT_MODEL),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
