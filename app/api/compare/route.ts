import { NextRequest, NextResponse } from 'next/server';

const COMPARE_TIMEOUT_MS = 15_000;
const TIMEOUT_ERROR_MESSAGE = 'Sarvam comparison request timed out';

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

        if (!response.ok) throw new Error('Sarvam API failed');
        const data = await response.json();
        return data.choices[0].message.content;
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

    return NextResponse.json({ error: 'Failed to generate comparisons' }, { status: 500 });
  }
}
