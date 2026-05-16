
// src/hooks/useStream.ts
import { useRef, useState } from 'react';

export function useStream() {
  const [output, setOutput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ tokenCount: 0, startTime: 0 });
const abortControllerRef = useRef<AbortController | null>(null);
  const startStream = async (prompt: string) => {
    setIsStreaming(true);
    setError(null);
    setOutput(''); // Clear previous run
    




    const startTime = performance.now();
    let localTokenCount = 0;
    setMetrics({ tokenCount: 0, startTime });

abortControllerRef.current = new AbortController();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Network error or no body returned');
      }

      // 1. Get the reader from the response stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // 2. Infinite loop to read chunks as they arrive
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break; // The stream is finished!

        // 3. Decode the byte array into a string chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Note: OpenAI-compatible streams send data in Server-Sent Events format like: "data: {"choices": [{"delta": {"content": "hello"}}]}\n\n"
        // We need to parse that. For now, let's simulate appending the raw text logic.
        // I will provide the precise SSE parsing logic in the next step, but conceptually:
        
        const extractedText = parseSSEChunk(chunk); 
        if (extractedText) {
             setOutput((prev) => prev + extractedText);
             
             // Update metrics
             localTokenCount += extractedText.trim().split(/\s+/).length; // Rough token estimation
             setMetrics({ tokenCount: localTokenCount, startTime });
        }
      }
    }
    catch (err: any) {
      // NEW: Catch the specific AbortError so we don't treat it as a crash
      if (err.name === 'AbortError') {
        setError('Generation stopped by user.');
      } else {
        setError('Connection interrupted mid-stream. Partial output preserved.');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null; // Cleanup
    }
  };

  // NEW: Function to manually trigger the abort
  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return { output, setOutput, isStreaming, error, metrics, startStream, stopStream };
}

// Helper to parse the data strings (OpenAI spec format)
function parseSSEChunk(chunk: string): string {
    const lines = chunk.split('\n').filter(line => line.trim() !== '');
    let text = '';
    for (const line of lines) {
        if (line.includes('[DONE]')) return text;
        if (line.startsWith('data: ')) {
            try {
                const data = JSON.parse(line.slice(6));
                text += data.choices[0]?.delta?.content || '';
            } catch (e) {
                // Ignore parse errors on incomplete chunks
            }
        }
    }
    return text;
}