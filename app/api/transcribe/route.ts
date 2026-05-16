// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Prepare the form data for Sarvam's API
    const sarvamFormData = new FormData();
sarvamFormData.append('file', file, 'recording.webm');
    sarvamFormData.append('model', 'saaras:v3');
    sarvamFormData.append('mode', 'transcribe');

    // Call Sarvam's official Speech-to-Text endpoint
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY || '',
      },
      body: sarvamFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Sarvam STT Error:', errorData);
      throw new Error(`Sarvam API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Sarvam returns { transcript: "..." }
    return NextResponse.json({ transcript: data.transcript });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}