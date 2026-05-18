import { NextRequest, NextResponse } from 'next/server';

const COMPARE_TIMEOUT_MS = 30_000;
const TIMEOUT_ERROR_MESSAGE = 'Sarvam comparison request timed out';
const EMPTY_OUTPUT_ERROR_MESSAGE = 'Sarvam returned an empty comparison output';

type SarvamChatResponse = {
  choices?: Array<{
    delta?: {
      content?: unknown;
    };
    message?: {
      content?: unknown;
    };
    text?: unknown;
  }>;
  output_text?: unknown;
  content?: unknown;
  error?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const fetchModelOutput = async (temperature: number, instruction: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);
      const messages: Array<{ role: 'user'; content: string }> = [
        {
          role: 'user',
          content: `${instruction}\n\nPrompt:\n${prompt}`,
        },
      ];

      try {
        const streamedContent = await requestSarvamCompletion({ messages, temperature, stream: true, signal: controller.signal });
        if (streamedContent) return streamedContent;

        const jsonContent = await requestSarvamCompletion({ messages, temperature, stream: false, signal: controller.signal });
        if (jsonContent) return jsonContent;

        throw new Error(EMPTY_OUTPUT_ERROR_MESSAGE);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(TIMEOUT_ERROR_MESSAGE);
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    };

    const outputA = await fetchModelOutput(
      0.1,
      "Answer as a highly factual baseline model. Return exactly 3 or 4 concise sentences. Do not use filler words."
    );

    const outputB = await fetchModelOutput(
      0.2,
      "Answer as a candidate model. Use slightly different vocabulary from the baseline while keeping the same core meaning. Return exactly 3 or 4 concise sentences."
    );

    return NextResponse.json({ modelA: outputA, modelB: outputB });

  } catch (error) {
    console.error('Comparison Error:', error);
    if (error instanceof Error && error.message === TIMEOUT_ERROR_MESSAGE) {
      return NextResponse.json(
        { error: 'Comparison timed out. Try again in a moment.' },
        { status: 504 }
      );
    }

    if (error instanceof Error && error.message === EMPTY_OUTPUT_ERROR_MESSAGE) {
      return NextResponse.json(
        { error: 'Sarvam returned an empty comparison. Try again in a moment.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: 'Failed to generate comparisons' }, { status: 500 });
  }
}

async function requestSarvamCompletion({
  messages,
  temperature,
  stream,
  signal,
}: {
  messages: Array<{ role: 'user'; content: string }>;
  temperature: number;
  stream: boolean;
  signal: AbortSignal;
}) {
  const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model: 'sarvam-30b',
      temperature,
      messages,
      stream,
    }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    console.error('Sarvam compare API failed:', response.status, rawBody.slice(0, 600));
    throw new Error('Sarvam API failed');
  }

  return extractSarvamResponseText(rawBody);
}

function extractAssistantText(data: SarvamChatResponse) {
  const firstChoice = data.choices?.[0];
  const content = firstChoice?.delta?.content ?? firstChoice?.message?.content ?? firstChoice?.text ?? data.output_text ?? data.content;

  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('')
      .trim();
  }

  return '';
}

function extractSarvamResponseText(rawBody: string) {
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) return '';

  if (trimmedBody.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmedBody) as SarvamChatResponse;
      if (parsed.error) {
        console.error('Sarvam compare returned error body:', JSON.stringify(parsed.error).slice(0, 600));
        return '';
      }

      return normalizeModelText(extractAssistantText(parsed));
    } catch {
      return '';
    }
  }

  const streamedText = trimmedBody
    .split(/\r?\n/)
    .map((line) => extractTextFromSSELine(line, { normalizeChunkSpacing: true }))
    .join('')
    .trim();

  if (streamedText) return normalizeModelText(streamedText);

  console.error('Sarvam compare returned unparsed body:', trimmedBody.slice(0, 600));
  return '';
}

function extractTextFromSSELine(line: string, options?: { normalizeChunkSpacing?: boolean }) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return '';

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === '[DONE]') return '';

  try {
    const text = extractAssistantText(JSON.parse(payload) as SarvamChatResponse);
    if (!options?.normalizeChunkSpacing) return text;

    return normalizeStreamChunk(text);
  } catch {
    return '';
  }
}

function normalizeStreamChunk(chunk: string) {
  if (!chunk) return '';
  if (/^[\s.,!?;:)\]}]/.test(chunk)) return chunk;

  return ` ${chunk}`;
}

function normalizeModelText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:%)\]}])/g, '$1')
    .replace(/([({\[])\s+/g, '$1')
    .trim();
}
