// src/app/api/chat/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Edge runtime is heavily optimized for streaming

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    // 1. Call Sarvam's API
    const sarvamResponse = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sarvam-30b', // Their fastest model for real-time chat
        messages: [{ role: 'user', content: prompt }],
        stream: true, // CRITICAL: This tells Sarvam not to wait for the full response
      }),
    });

    if (!sarvamResponse.ok) {
      throw new Error(`Sarvam API error: ${sarvamResponse.statusText}`);
    }

    // 2. We don't wait for JSON. We take the raw stream and pass it directly to the frontend.
    const stream = sarvamResponse.body;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}