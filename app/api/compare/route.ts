// src/app/api/compare/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Helper function to call Sarvam's API
    const fetchModelOutput = async (temperature: number, systemPrompt?: string) => {
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'sarvam-30b', // Fast and reliable
          temperature: temperature,
          messages: messages,
        }),
      });

      if (!response.ok) throw new Error('Sarvam API failed');
      const data = await response.json();
      return data.choices[0].message.content;
    };
// The Magic: Run both API calls in PARALLEL with Length Constraints
    const [outputA, outputB] = await Promise.all([
      // Model A (Strict base model, constrained length)
      fetchModelOutput(
        0.1, 
        "You are a highly factual assistant. Limit your response to exactly 3 or 4 concise sentences. Do not use filler words."
      ),
      
      // Model B (Slightly creative model, same length constraints)
      fetchModelOutput(
        0.2, 
        "You are a helpful assistant. Answer the prompt using slightly different vocabulary or synonyms, but keep the exact same core meaning. Limit your response to exactly 3 or 4 concise sentences."
      )
    ]);

    return NextResponse.json({ modelA: outputA, modelB: outputB });

  } catch (error) {
    console.error('Comparison Error:', error);
    return NextResponse.json({ error: 'Failed to generate comparisons' }, { status: 500 });
  }
}