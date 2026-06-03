import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/components/ToastProvider';

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
    setOutput('');

    const startTime = performance.now();

    let localTokenCount = 0;
    let fullText = '';
    let pendingText = '';
    let streamBuffer = '';

    const visibleTextFilter = createHiddenReasoningFilter();
    let animationFrameId: number | null = null;
    setMetrics({ tokenCount: 0, startTime });

    // Keep stream updates in sync with the browser paint cycle.
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {

        const { done, value } = await reader.read();
        
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split(/\r?\n/);
        streamBuffer = lines.pop() ?? '';

        const extractedText = visibleTextFilter.push(parseSSELines(lines)); 
        if (extractedText) {
             fullText += extractedText;
             pendingText += extractedText;

             localTokenCount += extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
             scheduleFlush();
        }
      }

      if (streamBuffer) {
        const extractedText = visibleTextFilter.push(parseSSELines([streamBuffer]));
        if (extractedText) {
          fullText += extractedText;
          pendingText += extractedText;
          localTokenCount += extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
          flushPendingText();
        }
      }

      const finalText = visibleTextFilter.flush();
      if (finalText) {
        fullText += finalText;
        pendingText += finalText;
        localTokenCount += finalText.trim() ? finalText.trim().split(/\s+/).length : 0;
        flushPendingText();
      }
    } catch (err: unknown) {
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
      abortControllerRef.current = null;
    }
  }, [toast]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { output, setOutput, isStreaming, error, metrics, startStream, stopStream };
}
  // 'data: {"choices":[{"delta":{"content":"On"}}]}',
  // ' datta' [done] 
function parseSSELines(lines: string[]): string {
    let text = '';
    for (const line of lines.filter(line => line.trim() !== '')) {
        const trimmed = line.trim();
        if (trimmed.includes('[DONE]')) return text;
        if (trimmed.startsWith('data:')) {
            try {
                const data = JSON.parse(trimmed.slice(5).trim());
                text += data.choices[0]?.delta?.content || '';
            } catch {
                // Incomplete chunks stay in the stream buffer until the next read.
            }
        }
    }
    return text;
}



function createHiddenReasoningFilter() {
  let pending = '';
  let insideHiddenBlock = false;

  const push = (chunk: string) => {
    if (!chunk) return '';

    pending += chunk;
    let visible = '';

    while (pending) {
      if (insideHiddenBlock) {
        const closeIndex = pending.toLowerCase().indexOf('</think>');
        if (closeIndex === -1) {
          pending = pending.slice(Math.max(0, pending.length - 7));
          return visible;
        }

        pending = pending.slice(closeIndex + 8);
        insideHiddenBlock = false;
        continue;
      }

      const openIndex = pending.toLowerCase().indexOf('<think>');
      if (openIndex === -1) {
        const keepLength = Math.min(6, pending.length);
        visible += pending.slice(0, pending.length - keepLength);
        pending = pending.slice(pending.length - keepLength);
        return visible;
      }

      visible += pending.slice(0, openIndex);
      pending = pending.slice(openIndex + 7);
      insideHiddenBlock = true;
    }

    return visible;
  };

  const flush = () => {
    if (insideHiddenBlock) {
      pending = '';
      insideHiddenBlock = false;
      return '';
    }

    const visible = pending;
    pending = '';
    return visible;
  };

  return { push, flush };
}
