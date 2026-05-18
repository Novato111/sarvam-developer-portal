import { NextRequest } from 'next/server';

export const runtime = 'edge';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = normalizeMessages(body);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sarvamResponse = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages,
        stream: true,
      }),
    });

    if (!sarvamResponse.ok) {
      throw new Error(`Sarvam API error: ${sarvamResponse.statusText}`);
    }

    const stream = sarvamResponse.body;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch {
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function normalizeMessages(body: unknown): ChatMessage[] {
  if (!body || typeof body !== 'object') return [];

  const payload = body as { prompt?: unknown; messages?: unknown };
  if (Array.isArray(payload.messages)) {
    return payload.messages
      .map((message) => {
        if (!message || typeof message !== 'object') return null;

        const candidate = message as { role?: unknown; content?: unknown };
        if (
          (candidate.role === 'user' || candidate.role === 'assistant' || candidate.role === 'system') &&
          typeof candidate.content === 'string' &&
          candidate.content.trim()
        ) {
          return {
            role: candidate.role,
            content: candidate.content,
          };
        }

        return null;
      })
      .filter((message): message is ChatMessage => message !== null);
  }

  if (typeof payload.prompt === 'string' && payload.prompt.trim()) {
    return [{ role: 'user', content: payload.prompt }];
  }

  return [];
}
