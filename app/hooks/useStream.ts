
// src/hooks/useStream.ts
import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/componets/ToastProvider';

export interface StreamMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamCallbacks {
  onToken?: (token: string) => void;
}

export function useStream() {
  const { toast } = useToast();
  const [output, setOutput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ tokenCount: 0, startTime: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (input: string | StreamMessage[], callbacks?: StreamCallbacks) => {
    setIsStreaming(true);
    setError(null);
    setOutput(''); // Clear previous run

    const startTime = performance.now();
    let localTokenCount = 0;
    let fullText = '';
    let pendingText = '';
    let animationFrameId: number | null = null;
    setMetrics({ tokenCount: 0, startTime });

    const flushPendingText = () => {
      if (!pendingText) return;

      const textToFlush = pendingText;
      pendingText = '';
      setOutput(fullText);
      callbacks?.onToken?.(textToFlush);
      setMetrics({ tokenCount: localTokenCount, startTime });
    };

    const scheduleFlush = () => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        flushPendingText();
      });
    };

    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Array.isArray(input) ? { messages: input } : { prompt: input }),
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
             fullText += extractedText;
             pendingText += extractedText;

             // Update metrics
             localTokenCount += extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0; // Rough token estimation
             scheduleFlush();
        }
      }
    } catch (err: unknown) {
      // NEW: Catch the specific AbortError so we don't treat it as a crash
      if (err instanceof Error && err.name === 'AbortError') {
        setError(null);
        toast({
          title: 'Stream stopped',
          description: 'Partial response preserved.',
          variant: 'default',
        });
      } else {
        setError('Connection interrupted mid-stream. Partial output preserved.');
        toast({
          title: 'Stream interrupted',
          description: 'Partial response preserved.',
          variant: 'destructive',
        });
      }
    } finally {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      flushPendingText();
      setIsStreaming(false);
      abortControllerRef.current = null; // Cleanup
    }
  }, [toast]);

  // NEW: Function to manually trigger the abort
  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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
            } catch {
                // Ignore parse errors on incomplete chunks
            }
        }
    }
    return text;
}
