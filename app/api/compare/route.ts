import { NextRequest, NextResponse } from 'next/server';

const COMPARE_TIMEOUT_MS = 30_000;
const TIMEOUT_ERROR_MESSAGE = 'Sarvam comparison request timed out';
const EMPTY_OUTPUT_ERROR_MESSAGE = 'Sarvam returned an empty comparison output';

type SarvamChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
    text?: unknown;
  }>;
  output_text?: unknown;
  content?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const fetchModelOutput = async (temperature: number, systemPrompt?: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      try {
        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'sarvam-30b',
            temperature: temperature,
            messages: messages,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Sarvam compare API failed:', response.status, errorText);
          throw new Error('Sarvam API failed');
        }

        const data = (await response.json()) as SarvamChatResponse;
        const content = extractAssistantText(data);
        if (!content) throw new Error(EMPTY_OUTPUT_ERROR_MESSAGE);

        return content;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(TIMEOUT_ERROR_MESSAGE);
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    };

    // Run both requests together so the diff view does not wait on them one by one.
    const [outputA, outputB] = await Promise.all([
      fetchModelOutput(
        0.1, 
        "You are a highly factual assistant. Limit your response to exactly 3 or 4 concise sentences. Do not use filler words."
      ),
      fetchModelOutput(
        0.2, 
        "You are a helpful assistant. Answer the prompt using slightly different vocabulary or synonyms, but keep the exact same core meaning. Limit your response to exactly 3 or 4 concise sentences."
      )
    ]);

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

function extractAssistantText(data: SarvamChatResponse) {
  const firstChoice = data.choices?.[0];
  const content = firstChoice?.message?.content ?? firstChoice?.text ?? data.output_text ?? data.content;

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
