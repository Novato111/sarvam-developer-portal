'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  AlertCircle,
  Mic,
  Plus,
  ArrowUp,
  Square,
  Keyboard,
  Sun,
  Moon,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useStream } from '../hooks/useStream';
import { useAudioRecord } from '../hooks/useAudioRecord';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; };
function createMessageId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

// ─── GLOBAL STYLES & ANIMATIONS ────────────────────────────────────────────────
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500&display=swap');

    @keyframes orbSpin    { to { transform:rotate(360deg) } }
    @keyframes orbRest    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    @keyframes orbThink   { 0%,100%{transform:scale(1.1)} 50%{transform:scale(1.18)} }
    @keyframes orbExit    { to { transform:scale(0.3); opacity:0 } }
    @keyframes ringPulse  { 0%{box-shadow:0 0 0 0 rgba(249,115,22,0.35)} 70%{box-shadow:0 0 0 10px transparent} 100%{box-shadow:0 0 0 0 transparent} }
    @keyframes dotBounce  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
    @keyframes cursorBlink{ 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fadeUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn    { from{opacity:0;transform:translateX(4px)} to{opacity:1;transform:translateX(0)} }
    @keyframes statusGlow { 0%,100%{opacity:0.5} 50%{opacity:1} }
  `}} />
);

// ─── IDLE HERO ────────────────────────────────────────────────────────────────
const CHIPS = [
  { icon: "≡", text: "Summarize a topic" },
  { icon: "◎", text: "Translate to Hindi" },
  { icon: "✦", text: "Explain a concept" },
  { icon: "↗", text: "Draft an email" },
];

function IdleHero({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden gap-6 -mt-12">
      {/* user requested: remove the gradient in the top - Orb div removed from here */}
      
      <div className="text-center relative animate-[fadeUp_0.4s_ease]">
        <h1 className="font-['Geist'] text-[26px] font-semibold text-[#09090b] dark:text-[#fafafa] tracking-[-0.03em] mb-2 leading-[1.2]">How can I help you today?</h1>
        <p className="font-['Geist_Mono'] text-[11px] text-[#71717a] tracking-[0.02em]">sarvam-m · multilingual · 22+ languages</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center max-w-[440px] relative">
        {CHIPS.map((c, i) => (
          <button 
            key={i} 
            onClick={() => onChip(c.text)} 
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-black/5 dark:border-white/10 bg-[#fafafa] dark:bg-[#18181b] text-[#71717a] text-xs cursor-pointer font-['Geist'] transition-all hover:border-black/10 dark:hover:border-white/20 hover:text-[#09090b] dark:hover:text-[#fafafa] hover:bg-[#f4f4f5] dark:hover:bg-[#1c1c1f] tracking-[-0.01em] shadow-sm"
            style={{ animation: `fadeUp ${0.3 + i * 0.06}s ease` }}
          >
            <span className="text-[11px] opacity-65">{c.icon}</span>{c.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── THINKING PERSONA ─────────────────────────────────────────────────────────
function ThinkingPersona({ state, streamedText }: { state: 'idle'|'thinking'|'streaming'|'done', streamedText: string }) {
  const isThinking  = state === "thinking";
  const isStreaming  = state === "streaming";
  const showOrb     = state !== "done";
  const showDots    = isThinking;
  const showText    = isStreaming || state === "done";
  const showCursor  = isStreaming;
  const showRing    = isThinking;

  const orbAnim = isThinking ? "animate-[orbThink_0.9s_ease-in-out_infinite]" : isStreaming || state === "done" ? "animate-[orbExit_0.3s_ease_forwards]" : "animate-[orbRest_3.5s_ease-in-out_infinite]";
  const spinSpeed = isThinking ? "0.8s" : state === "idle" ? "4.5s" : "1.8s";

  return (
    <div className="flex gap-2.5 items-start animate-[fadeUp_0.2s_ease]">
      {/* Orb */}
      <div className="w-7 h-7 shrink-0 relative">
        {showOrb && (
          <div className={`w-7 h-7 rounded-full overflow-hidden relative ${orbAnim}`}>
            <div className="absolute inset-0" style={{ background: "conic-gradient(from 0deg,#f97316 0%,#a855f7 25%,#3b82f6 50%,#10b981 75%,#f97316 100%)", animation: `orbSpin ${spinSpeed} linear infinite` }} />
            <div className="absolute top-[3px] left-[3px] right-[3px] bottom-[3px] rounded-full bg-white dark:bg-[#0f0f12] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full transition-opacity duration-400" style={{ background: "conic-gradient(from 0deg,#f97316,#3b82f6,#f97316)", opacity: isThinking ? 1 : 0.35, animation: `orbSpin ${isThinking ? "0.55s" : "2.2s"} linear infinite` }} />
            </div>
          </div>
        )}
        {showRing && <div className="absolute -inset-[5px] rounded-full pointer-events-none animate-[ringPulse_1.1s_ease-out_infinite]" />}
      </div>

      {/* Bubble */}
      <div className={`bg-[#fafafa] dark:bg-[#18181b] border border-black/5 dark:border-white/10 rounded-[3px_12px_12px_12px] text-sm leading-[1.75] text-[#09090b] dark:text-[#fafafa] font-['Geist'] max-w-[78%] animate-[fadeIn_0.18s_ease] tracking-[-0.01em] shadow-sm ${showDots ? 'px-4 py-[11px] min-w-[68px]' : 'px-4 py-2.5'}`}>
        {showDots && (
          <div className="flex gap-[5px] items-center h-[18px]">
            {[0, 140, 280].map(d => <div key={d} className="w-[5px] h-[5px] rounded-full bg-[#71717a] opacity-60" style={{ animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: `${d}ms` }} />)}
          </div>
        )}
        {showText && <span>{streamedText}{showCursor && <span className="inline-block w-0.5 h-[13px] bg-[#f97316] ml-1 align-middle animate-[cursorBlink_0.75s_ease_infinite]" />}</span>}
      </div>
    </div>
  );
}

// ─── RIGHT SIDEBAR (METRICS) ──────────────────────────────────────────────────
function RightSidebar({ metrics, isStreaming, isThinking, model, mode, error, onClearError }: any) {
  const statusState = isThinking ? "thinking" : isStreaming ? "streaming" : "idle";
  const statusColor = isThinking ? "#f97316" : isStreaming ? "#22c55e" : "#71717a";

  const MRow = ({ label, value, mono, accent, live }: any) => (
    <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/10 last:border-0">
      <span className="font-['Geist'] text-xs text-[#71717a] tracking-[-0.01em]">{label}</span>
      <div className="flex items-center gap-1.5">
        {live && (isStreaming || isThinking) && <div className="w-[5px] h-[5px] rounded-full animate-[statusGlow_1s_ease_infinite]" style={{ background: statusColor }} />}
        <span className={`text-xs font-medium transition-all ${mono ? "font-['Geist_Mono'] tracking-normal" : "font-['Geist'] tracking-[-0.01em]"} ${accent ? "bg-[linear-gradient(135deg,#2563eb,#f97316)] bg-clip-text text-transparent" : "text-[#09090b] dark:text-[#fafafa]"}`}>
          {value}
        </span>
      </div>
    </div>
  );

  const Section = ({ title, children }: any) => (
    <div className="mb-5">
      <div className="font-['Geist'] text-[11px] font-medium text-[#71717a] tracking-[-0.01em] mb-2">{title}</div>
      <div className="bg-[#f4f4f5] dark:bg-[#0f0f12] border border-black/5 dark:border-white/10 rounded-[10px] px-3 py-0.5 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );

  const BigMetric = ({ label, value, unit, accent }: any) => (
    <div className="bg-[#f4f4f5] dark:bg-[#0f0f12] border border-black/5 dark:border-white/10 rounded-[10px] p-[12px_14px] shadow-sm">
      <div className="font-['Geist'] text-[11px] text-[#71717a] mb-1.5 tracking-[-0.01em]">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-['Geist_Mono'] text-2xl font-medium tracking-[-0.03em] transition-all ${accent ? "bg-[linear-gradient(135deg,#2563eb,#f97316)] bg-clip-text text-transparent" : "text-[#09090b] dark:text-[#fafafa]"}`}>
          {value}
        </span>
        {unit && <span className="font-['Geist_Mono'] text-[11px] text-[#71717a]">{unit}</span>}
      </div>
    </div>
  );

  return (
    <aside className="w-[240px] shrink-0 border-l border-black/5 dark:border-white/10 bg-[#fafafa] dark:bg-[#09090b] flex flex-col h-full overflow-hidden">
      <div className="p-[14px_16px_12px] border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <span className="font-['Geist'] text-[13px] font-medium text-[#09090b] dark:text-[#fafafa] tracking-[-0.01em]">Inspector</span>
        <div className="flex items-center gap-1.5 font-['Geist_Mono'] text-[10px] bg-[#f4f4f5] dark:bg-[#27272a] px-2 py-[3px] rounded-md shadow-sm" style={{ color: statusColor }}>
          <div className={`w-[5px] h-[5px] rounded-full ${isStreaming || isThinking ? 'animate-[statusGlow_1s_ease_infinite]' : ''}`} style={{ background: statusColor }} />
          {statusState}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Section title="Persona">
          <MRow label="State" value={statusState} mono accent={isThinking || isStreaming} live />
          <MRow label="Mode"  value={mode} mono />
          <MRow label="Model" value={model} mono />
        </Section>

        <div className="mb-5">
          <div className="font-['Geist'] text-[11px] font-medium text-[#71717a] tracking-[-0.01em] mb-2">Live metrics</div>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <BigMetric label="Tokens" value={metrics.tokens > 0 ? metrics.tokens : "—"} accent={metrics.tokens > 0} />
            <BigMetric label="Tok/sec" value={metrics.tps > 0 ? metrics.tps : "—"} unit={metrics.tps > 0 ? "t/s" : ""} accent={metrics.tps > 0} />
          </div>
          <BigMetric label="Elapsed" value={metrics.elapsed > 0 ? metrics.elapsed : "—"} unit={metrics.elapsed > 0 ? "s" : ""} />
        </div>

        <Section title="Runtime">
          <MRow label="Provider"  value="Sarvam AI" mono={false} />
          <MRow label="Context"   value="32k ctx"   mono />
          <MRow label="Latency"   value="~80ms"     mono />
          <MRow label="Languages" value="22+ langs" mono={false} />
        </Section>

        <Section title="Endpoint">
          <MRow label="Base"   value="api.sarvam.ai" mono />
          <MRow label="Route"  value="/v1/chat" mono />
          <MRow label="Stream" value="SSE" mono />
        </Section>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[10px] p-[10px_12px] mb-4 animate-[slideIn_0.2s_ease]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-['Geist_Mono'] text-[10px] text-red-500 font-medium tracking-wide">Error</span>
              <button onClick={onClearError} className="text-red-500 hover:text-red-600 cursor-pointer text-[15px] leading-none">×</button>
            </div>
            <div className="font-['Geist'] text-[11px] text-red-600 dark:text-red-400 leading-[1.6] opacity-90">{error}</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Playground() {
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [promptText, setPromptText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { setOutput, isStreaming, error, metrics, startStream, stopStream } = useStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const lastMsg = messages[messages.length - 1];
  const isThinking = isStreaming && (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content);
  const personaState = isThinking ? 'thinking' : isStreaming ? 'streaming' : 'idle';

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, isStreaming]);

  useEffect(() => {
    if (!isStreaming || metrics.startTime === 0) return;
    const interval = window.setInterval(() => setElapsedMs(performance.now() - metrics.startTime), 100);
    return () => window.clearInterval(interval);
  }, [isStreaming, metrics.startTime]);

  const handleSubmit = (overrideText?: string) => {
    const textToSend = overrideText || promptText;
    if (!textToSend.trim() || isStreaming) return;
    const userMessage: ChatMessage = { id: createMessageId(), role: 'user', content: textToSend.trim() };
    const assistantMessage: ChatMessage = { id: createMessageId(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setPromptText(''); setElapsedMs(0); setOutput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
    void startStream(apiMessages, {
      onToken: (token) => {
        setMessages(current => current.map(m => m.id === assistantMessage.id ? { ...m, content: m.content + token } : m));
      },
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
    e.target.style.height = "auto"; 
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  const { startRecording, stopRecording, isRecording, isTranscribing, audioError } = useAudioRecord((transcript) => {
    setPromptText(transcript); setInputMode('text');
  });

  const secondsElapsed = elapsedMs / 1000;
  const speed = metrics.tokenCount > 0 && secondsElapsed > 0 ? `${(metrics.tokenCount / secondsElapsed).toFixed(1)}` : '—';
  const latency = metrics.startTime > 0 && elapsedMs > 0 ? `${secondsElapsed.toFixed(2)}` : '—';
  const currentTheme = mounted && theme === 'system' ? systemTheme : theme;
  const canSend = promptText.trim() && !isStreaming && !isThinking;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#09090b] font-sans">
      <GlobalStyles />
      
      {/* ─── CENTER CHAT AREA ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0f0f12]">
        
        {/* Header */}
        <header className="h-[50px] px-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 bg-[#fafafa] dark:bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <span className="font-['Geist'] text-sm font-medium text-[#09090b] dark:text-[#fafafa] tracking-[-0.02em]">Inference Playground</span>
            <span className="font-['Geist_Mono'] text-[10px] text-[#71717a] bg-[#f4f4f5] dark:bg-[#27272a] px-2 py-[2px] rounded-[5px]">Stream · Metrics · Multi-modal</span>
          </div>
          <div className="flex gap-1.5 items-center">
            {["Docs", "Feedback"].map(b => (
              <button key={b} className="px-3 py-[5px] rounded-[7px] border border-black/5 dark:border-white/10 bg-transparent text-[#71717a] text-xs cursor-pointer font-['Geist'] tracking-[-0.01em] transition-all hover:border-black/10 dark:hover:border-white/20 hover:text-[#09090b] dark:hover:text-[#fafafa]">
                {b}
              </button>
            ))}
            {mounted && (
              <button 
                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-[7px] border border-black/5 dark:border-white/10 text-[#71717a] hover:text-[#09090b] dark:hover:text-[#fafafa] hover:border-black/10 dark:hover:border-white/20 transition-all ml-1"
              >
                {currentTheme === 'dark' ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
              </button>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col relative">
          {messages.length === 0 && !isStreaming ? (
            <IdleHero onChip={handleSubmit} />
          ) : (
            <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full pb-6">
              {messages.map((m, i) => {
                const isLastStreaming = isStreaming && i === messages.length - 1;
                if (m.role === 'user') {
                  return (
                    <div key={m.id} className="flex gap-2 flex-row-reverse items-start animate-[fadeUp_0.18s_ease]">
                      <div className="w-[26px] h-[26px] rounded-full shrink-0 bg-[linear-gradient(135deg,#2563eb,#f97316)] flex items-center justify-center shadow-sm">
                        <span className="font-['Geist'] text-[9px] font-semibold text-white">U</span>
                      </div>
                      <div className="max-w-[76%] bg-[#f4f4f5] dark:bg-[#18181b] border border-black/5 dark:border-white/10 rounded-[12px_12px_3px_12px] px-[14px] py-[9px] text-[14px] leading-[1.7] text-[#09090b] dark:text-[#fafafa] font-['Geist'] tracking-[-0.01em] shadow-sm">
                        {m.content}
                      </div>
                    </div>
                  );
                }
                if (isLastStreaming) return <ThinkingPersona key={m.id} state={personaState} streamedText={m.content} />;
                return (
                  <div key={m.id} className="flex gap-2 items-start animate-[fadeUp_0.18s_ease]">
                    <div className="w-[26px] h-[26px] rounded-full overflow-hidden shrink-0 shadow-sm">
                      <div className="w-full h-full bg-[conic-gradient(from_0deg,#f97316,#a855f7,#3b82f6,#10b981,#f97316)]" />
                    </div>
                    <div className="max-w-[78%] text-[14px] leading-[1.75] text-[#09090b] dark:text-[#fafafa] font-['Geist'] py-[2px] tracking-[-0.01em] whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} className="h-4" />
            </div>
          )}
        </div>

        {/* ─── ENHANCED INPUT BOX ─── */}
        <div className="relative px-4 pb-8 pt-2 shrink-0 max-w-4xl mx-auto w-full z-10 mb-4">
          
          {/* Glowing Gradient Background - Stronger opacity and larger range */}
          <div className="absolute bottom-[-20px] left-[-20px] right-[-20px] h-[160px] bg-gradient-to-r from-blue-600/50 via-purple-600/70 to-orange-500/70 dark:from-blue-600/60 dark:via-purple-600/80 dark:to-orange-500/80 blur-[60px] -z-10 pointer-events-none rounded-full transition-opacity duration-500" />
          
          <div className="bg-[#fafafa] dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-[32px] transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] focus-within:border-black/20 dark:focus-within:border-white/20 flex flex-col overflow-hidden">
            
            {/* Top Textarea Section */}
            <div className="px-5 pt-4 pb-1">
              {inputMode === 'text' ? (
                <textarea
                  ref={textareaRef}
                  value={promptText}
                  onChange={handleInput}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Ask anything..."
                  className="w-full resize-none bg-transparent outline-none text-[15px] leading-[1.65] font-['Geist'] text-[#09090b] dark:text-[#fafafa] placeholder:text-[#a1a1aa] dark:placeholder:text-[#52525b] min-h-[32px] max-h-[128px] caret-[#f97316] tracking-[-0.01em]"
                  disabled={isStreaming || isThinking}
                  rows={1}
                />
              ) : (
                <div className="h-[32px] flex items-center text-[15px] font-['Geist'] tracking-[-0.01em]">
                  {audioError ? <span className="text-red-500">{audioError}</span> : isTranscribing ? <span className="text-blue-500 font-medium">Transcribing audio...</span> : isRecording ? <span className="text-red-500 animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Recording...</span> : <span className="text-[#a1a1aa] dark:text-[#52525b]">Recording audio... tap mic to stop</span>}
                </div>
              )}
            </div>

            {/* Bottom Toolbar Section */}
            <div className="px-3 pb-3 flex items-center justify-between">
              
              {/* Left Side: Plus Icon & Helper Text */}
              <div className="flex items-center gap-3 pl-1">
                <button className="w-9 h-9 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center text-[#71717a] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <Plus className="w-4.5 h-4.5" />
                </button>
                <span className="text-[11px] text-[#a1a1aa] dark:text-[#52525b] font-['Geist'] hidden sm:inline-block select-none opacity-80">
                  Press <kbd className="font-['Geist_Mono'] text-[9px] px-1 py-0.5 rounded-sm border border-black/10 dark:border-white/10 mx-0.5">Shift</kbd> + <kbd className="font-['Geist_Mono'] text-[9px] px-1 py-0.5 rounded-sm border border-black/10 dark:border-white/10 mx-0.5">Enter</kbd> for new line
                </span>
              </div>
              
              {/* Right Side: Tools & Send */}
              <div className="flex items-center gap-1.5">
                
                {/* Model Selector Pill */}
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#27272a]/50 text-[#71717a] dark:text-[#a1a1aa] text-[13px] font-['Geist'] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
                  {inputMode === 'text' ? 'sarvam-m' : 'saaras:v3'}
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 ml-0.5" />
                </div>

                {/* Keyboard (Text Mode) */}
                <button 
                  onClick={() => setInputMode('text')} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${inputMode === 'text' ? 'bg-[#f4f4f5] dark:bg-[#27272a] text-[#09090b] dark:text-[#fafafa] border border-black/10 dark:border-white/10 shadow-sm' : 'text-[#71717a] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <Keyboard className="w-4.5 h-4.5" />
                </button>

                {/* Mic (Audio Mode & Record Toggle) */}
                <button 
                  onClick={() => {
                    if (inputMode !== 'audio') setInputMode('audio');
                    else isRecording ? stopRecording() : startRecording();
                  }} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${inputMode === 'audio' ? (isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-[#f4f4f5] dark:bg-[#27272a] text-[#09090b] dark:text-[#fafafa] border border-black/10 dark:border-white/10 shadow-sm') : 'text-[#71717a] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4.5 h-4.5" />}
                </button>
                
                {/* Send Button */}
                <button 
                  onClick={() => handleSubmit()} 
                  disabled={!canSend} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ml-1 ${canSend ? "bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-[#09090b] shadow-md hover:scale-105 cursor-pointer border-none" : "bg-[#f4f4f5] dark:bg-[#27272a] text-[#a1a1aa] dark:text-[#52525b] border border-black/5 dark:border-white/10 cursor-default"}`}
                >
                  {isStreaming || isThinking 
                    ? <div className="w-4 h-4 border-[2px] border-current border-t-transparent rounded-full animate-[spin_0.7s_linear_infinite]" />
                    : <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                  }
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── RIGHT METRICS PANEL ───────────────────────────────────────────── */}
      <RightSidebar 
        metrics={{ tokens: metrics.tokenCount, tps: speed !== '—' ? Number(speed) : 0, elapsed: latency !== '—' ? Number(latency) : 0 }} 
        isStreaming={isStreaming} 
        isThinking={isThinking} 
        model={inputMode === "text" ? "sarvam-m" : "saaras:v3"} 
        mode={inputMode} 
        error={error} 
        onClearError={() => {/* Hook doesn't provide clear error natively, usually clears on next request */}} 
      />
    </div>
  );
}