// src/app/playground/page.tsx
'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Keyboard,
  Mic,
  Plus,
  SendHorizontal,
  Sparkles,
  Square,
  Type,
} from 'lucide-react';
import { useStream } from '../hooks/useStream';
import { useAudioRecord } from '../hooks/useAudioRecord';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Playground() {
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [promptText, setPromptText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  const { setOutput, isStreaming, error, metrics, startStream, stopStream } = useStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const savedPrompt = localStorage.getItem('sarvam_prompt');
      const savedMessages = localStorage.getItem('sarvam_messages');

      if (savedPrompt) setPromptText(savedPrompt);

      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages) as ChatMessage[];
          const validMessages = parsedMessages.filter(
            (message) =>
              (message.role === 'user' || message.role === 'assistant') &&
              typeof message.content === 'string' &&
              typeof message.id === 'string'
          );

          setMessages(validMessages);
          const latestAssistantMessage = [...validMessages].reverse().find((message) => message.role === 'assistant');
          if (latestAssistantMessage) setOutput(latestAssistantMessage.content);
        } catch {
          localStorage.removeItem('sarvam_messages');
        }
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, [setOutput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      localStorage.setItem('sarvam_prompt', promptText);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [promptText]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (messages.length === 0) {
        localStorage.removeItem('sarvam_messages');
        return;
      }

      localStorage.setItem('sarvam_messages', JSON.stringify(messages));
    }, isStreaming ? 500 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [messages, isStreaming]);

  useEffect(() => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ block: 'end' });
      scrollFrameRef.current = null;
    });

    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [messages]);

  useEffect(() => {
    if (!isStreaming || metrics.startTime === 0) {
      return;
    }

    const updateElapsed = () => setElapsedMs(performance.now() - metrics.startTime);
    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 400);

    return () => window.clearInterval(intervalId);
  }, [isStreaming, metrics.startTime]);

  const handleSubmit = () => {
    if (!promptText.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: promptText.trim(),
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
    };
    const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
    setPromptText('');
    setElapsedMs(0);
    setOutput('');
    void startStream(apiMessages, {
      onToken: (token) => {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: message.content + token,
                }
              : message
          )
        );
      },
    });
  };

  const handleTranscriptionComplete = useCallback((transcript: string) => {
    setPromptText(transcript);
    setInputMode('text');
  }, []);

  const { startRecording, stopRecording, isRecording, isTranscribing, audioError } =
    useAudioRecord(handleTranscriptionComplete);

  const secondsElapsed = elapsedMs / 1000;
  const speed =
    metrics.tokenCount > 0 && secondsElapsed > 0 ? `${(metrics.tokenCount / secondsElapsed).toFixed(2)} tok/s` : '--';
  const latency = metrics.startTime > 0 && elapsedMs > 0 ? `${secondsElapsed.toFixed(1)} s` : '--';
  const sessionState = isStreaming ? 'Live' : messages.length > 0 ? `${Math.ceil(messages.length / 2)} turns` : 'New';
  const statusText = isStreaming ? 'Generating' : messages.length > 0 ? 'Ready' : 'Inactive';

  return (
    <div className="h-screen overflow-hidden bg-white p-3 dark:bg-[#07080a] sm:p-4">
      <section className="relative h-[calc(100vh-1.5rem)] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_64px_rgba(15,23,42,0.09)] ring-1 ring-slate-900/[0.03] dark:border-white/10 dark:bg-[#101216] dark:shadow-[0_18px_64px_rgba(0,0,0,0.55)] dark:ring-white/5 sm:h-[calc(100vh-2rem)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(105deg,rgba(255,166,73,0.45),rgba(255,119,138,0.16),rgba(112,112,255,0.28))] dark:bg-[linear-gradient(105deg,rgba(73,68,255,0.5),rgba(178,74,190,0.25),rgba(255,96,12,0.45))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(107,114,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.84))] dark:bg-[radial-gradient(circle_at_70%_10%,rgba(124,116,255,0.16),transparent_30%),linear-gradient(180deg,rgba(16,18,22,0.98),rgba(10,12,16,0.9))]" />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-7">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Playground</h1>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Test model responses in real time with text or voice input.
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#8578ff] via-[#c46bff] to-[#ff8a4b] text-xs font-bold text-white shadow-lg shadow-violet-200">
              SU
            </div>
          </header>

          <div className="shrink-0 px-5 pt-4 sm:px-7">
            <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white/76 p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_12px_34px_rgba(0,0,0,0.25)] sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1.1fr]">
              <Metric label="Tokens" value={metrics.tokenCount > 0 ? String(metrics.tokenCount) : '--'} />
              <Metric label="Speed" value={speed} />
              <Metric label="Latency" value={latency} />
              <Metric label="Session" value={sessionState} />
              <div className="flex items-center gap-2 border-slate-200 dark:border-white/10 xl:border-l xl:pl-6">
                <span className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{statusText}</span>
              </div>
            </div>
          </div>

          <main className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-7">
            {error && (
              <div className="mb-3 flex shrink-0 items-start gap-2 rounded-2xl border border-red-200 bg-red-50/90 p-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <h2 className="text-xs font-semibold">Stream notification</h2>
                  <p className="mt-1 text-xs">{error}</p>
                </div>
              </div>
            )}

            <div className="flex min-h-0 flex-1 items-stretch justify-center pb-4">
              <div
                className="flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/86 shadow-[0_14px_42px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1117]/86 dark:shadow-[0_14px_42px_rgba(0,0,0,0.35)]"
                aria-live="polite"
                aria-atomic="false"
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/72 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
                  <div>
                    <h2 className="text-xs font-semibold text-slate-950 dark:text-white">Conversation</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {isStreaming ? 'Streaming latest response' : messages.length > 0 ? 'Chat history preserved' : 'No messages yet'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-200">
                    <span className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {statusText}
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-6 text-slate-800 dark:text-slate-100 sm:p-5">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <ChatBubble
                        key={message.id}
                        isActiveStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                        message={message}
                      />
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Start a message below. Your prompts and Sarvam responses will stay in this chat.
                    </span>
                  )}
                  <div ref={scrollRef} className="h-2" />
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-5xl shrink-0 rounded-2xl border border-slate-200 bg-white/88 p-3 shadow-[0_14px_48px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#14171d]/88 dark:shadow-[0_14px_48px_rgba(0,0,0,0.35)]">
              <div className="min-h-[48px]">
                {inputMode === 'text' ? (
                  <textarea
                    value={promptText}
                    onChange={(event) => setPromptText(event.target.value)}
                    placeholder="Ask anything..."
                    className="h-16 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-white dark:placeholder:text-slate-500 dark:disabled:text-slate-500"
                    disabled={isStreaming}
                    aria-label="Text prompt input"
                  />
                ) : (
                  <div className="grid h-16 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 text-xs dark:border-white/10 dark:bg-white/[0.035]">
                    {audioError ? (
                      <span className="text-red-600 dark:text-red-300">{audioError}</span>
                    ) : isTranscribing ? (
                      <span className="font-medium text-[#5161ff] dark:text-[#9294ff]">Transcribing audio...</span>
                    ) : isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Stop recording
                        <span className="relative ml-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        <Mic className="h-3.5 w-3.5" />
                        Start recording
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-[#5161ff] dark:border-white/10 dark:text-slate-300 dark:hover:border-[#9294ff]/50 dark:hover:text-[#9294ff]"
                  aria-label="Add context"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/[0.045]">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`grid h-8 w-8 place-items-center rounded-full transition ${
                        inputMode === 'text' ? 'bg-white text-[#5161ff] shadow-sm dark:bg-white/10 dark:text-[#9294ff]' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                      aria-pressed={inputMode === 'text'}
                      aria-label="Switch to text input"
                    >
                      <Type className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('audio')}
                      className={`grid h-8 w-8 place-items-center rounded-full transition ${
                        inputMode === 'audio' ? 'bg-white text-[#5161ff] shadow-sm dark:bg-white/10 dark:text-[#9294ff]' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                      aria-pressed={inputMode === 'audio'}
                      aria-label="Switch to audio input"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-[#5161ff] shadow-sm dark:border-white/10 dark:bg-white/[0.045] dark:text-[#9294ff]"
                    aria-label="Selected model"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    sarvam-m
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  </button>

                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-[#5161ff] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:text-[#9294ff]"
                    aria-label="Keyboard input"
                    onClick={() => setInputMode('text')}
                  >
                    <Keyboard className="h-4 w-4" />
                  </button>

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stopStream}
                      className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-200 transition hover:bg-red-600"
                      aria-label="Stop inference"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!promptText.trim()}
                      className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-300 transition hover:bg-[#5161ff] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:bg-white dark:text-slate-950 dark:shadow-none dark:hover:bg-[#9294ff] dark:disabled:bg-white/20 dark:disabled:text-slate-500"
                      aria-label="Run inference"
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}

const ChatBubble = memo(function ChatBubble({
  isActiveStreaming,
  message,
}: {
  isActiveStreaming: boolean;
  message: ChatMessage;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-3 shadow-sm ${
          isUser
            ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
            : 'border border-slate-200 bg-white/90 text-slate-800 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-100'
        }`}
      >
        <div
          className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            isUser ? 'text-white/60 dark:text-slate-500' : 'text-[#5161ff] dark:text-[#9294ff]'
          }`}
        >
          {isUser ? 'You' : 'Sarvam'}
        </div>
        {message.content ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="text-slate-400 dark:text-slate-500">Waiting for first token...</div>
        )}
        {isActiveStreaming && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse rounded-sm bg-[#5161ff]" />}
      </div>
    </div>
  );
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-slate-200 dark:border-white/10 sm:border-r sm:pr-4">
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 min-h-5 font-mono text-sm font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
