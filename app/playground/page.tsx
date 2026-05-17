'use client';

import { memo, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Mic,
  Plus,
  ArrowUp,
  Square,
  Keyboard,
  Sun,
  Moon,
  ChevronDown,
  Check
} from 'lucide-react';
import { useStream } from '../hooks/useStream';
import { useAudioRecord } from '../hooks/useAudioRecord';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; };
function createMessageId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
const subscribeHydration = () => () => {};
function useIsHydrated() { return useSyncExternalStore(subscribeHydration, () => true, () => false); }
type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; code: string }
  | { type: 'hr' };

function isMarkdownBlockStart(line: string) {
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    /^```/.test(trimmed) ||
    /^#{1,4}\s+/.test(trimmed) ||
    /^[-*_]{3,}$/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line)
  );
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', code: codeLines.join('\n') });
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+[.)]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length && !isMarkdownBlockStart(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function safeHref(href: string) {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|\/)/.test(trimmed)) return trimmed;
  return '#';
}

function renderInlineMarkdown(text: string, keyPrefix = 'inline'): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;
  let textBuffer = '';

  const flushText = () => {
    if (!textBuffer) return;
    nodes.push(textBuffer);
    textBuffer = '';
  };

  while (index < text.length) {
    if (text.startsWith('`', index)) {
      const end = text.indexOf('`', index + 1);
      if (end > index) {
        flushText();
        nodes.push(
          <code key={`${keyPrefix}-code-${index}`} className="rounded bg-black/[0.06] px-1 py-0.5 font-medium text-[0.92em] dark:bg-white/10">
            {text.slice(index + 1, end)}
          </code>
        );
        index = end + 1;
        continue;
      }
    }

    if (text.startsWith('**', index) || text.startsWith('__', index)) {
      const marker = text.slice(index, index + 2);
      const end = text.indexOf(marker, index + 2);
      if (end > index) {
        flushText();
        nodes.push(<strong key={`${keyPrefix}-strong-${index}`} className="font-semibold text-[#09090b] dark:text-[#fafafa]">{renderInlineMarkdown(text.slice(index + 2, end), `${keyPrefix}-strong-${index}`)}</strong>);
        index = end + 2;
        continue;
      }
    }

    if (text.startsWith('*', index) || text.startsWith('_', index)) {
      const marker = text[index];
      const end = text.indexOf(marker, index + 1);
      if (end > index) {
        flushText();
        nodes.push(<em key={`${keyPrefix}-em-${index}`} className="text-[#3f3f46] dark:text-[#d4d4d8]">{renderInlineMarkdown(text.slice(index + 1, end), `${keyPrefix}-em-${index}`)}</em>);
        index = end + 1;
        continue;
      }
    }

    if (text.startsWith('[', index)) {
      const labelEnd = text.indexOf(']', index + 1);
      const hrefStart = labelEnd >= 0 ? text.indexOf('(', labelEnd) : -1;
      const hrefEnd = hrefStart >= 0 ? text.indexOf(')', hrefStart) : -1;
      if (labelEnd > index && hrefStart === labelEnd + 1 && hrefEnd > hrefStart) {
        const href = safeHref(text.slice(hrefStart + 1, hrefEnd));
        flushText();
        nodes.push(
          <a key={`${keyPrefix}-link-${index}`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="font-medium text-[#2563eb] underline decoration-black/15 underline-offset-4 dark:text-[#93a4ff] dark:decoration-white/20">
            {renderInlineMarkdown(text.slice(index + 1, labelEnd), `${keyPrefix}-link-${index}`)}
          </a>
        );
        index = hrefEnd + 1;
        continue;
      }
    }

    textBuffer += text[index];
    index += 1;
  }

  flushText();
  return nodes;
}

function AssistantMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  const blocks = parseMarkdownBlocks(content);

  if (!content.trim()) return null;

  return (
    <div className="space-y-3 text-[14px] leading-[1.75] tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = `h${Math.min(block.level + 1, 4)}` as 'h2' | 'h3' | 'h4';
          return (
            <HeadingTag key={index} className="pt-1 font-['Geist'] text-[15px] font-semibold leading-[1.45] text-[#09090b] dark:text-[#fafafa]">
              {renderInlineMarkdown(block.text, `heading-${index}`)}
            </HeadingTag>
          );
        }

        if (block.type === 'paragraph') {
          return <p key={index}>{renderInlineMarkdown(block.text, `paragraph-${index}`)}</p>;
        }

        if (block.type === 'ul') {
          return (
            <ul key={index} className="space-y-1 pl-5 [list-style-type:disc] marker:text-[#a1a1aa]">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item, `ul-${index}-${itemIndex}`)}</li>)}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={index} className="space-y-1 pl-5 [list-style-type:decimal] marker:text-[#a1a1aa]">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}</li>)}
            </ol>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={index} className="border-l-2 border-black/10 pl-3 text-[#52525b] dark:border-white/15 dark:text-[#d4d4d8]">
              {renderInlineMarkdown(block.text, `quote-${index}`)}
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={index} className="overflow-x-auto rounded-[10px] border border-black/5 bg-[#f4f4f5] p-3 font-medium text-[12px] leading-6 text-[#27272a] dark:border-white/10 dark:bg-[#09090b] dark:text-[#e4e4e7]">
              <code>{block.code}</code>
            </pre>
          );
        }

        return <hr key={index} className="border-black/10 dark:border-white/10" />;
      })}
      {streaming && <span className="inline-block h-[13px] w-0.5 translate-y-[2px] bg-[#f97316] align-middle animate-[cursorBlink_0.75s_ease_infinite]" />}
    </div>
  );
}

// ─── GLOBAL STYLES & ANIMATIONS ────────────────────────────────────────────────
const GlobalStyles = memo(function GlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

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
    @keyframes personaBreathe { 0%,100%{transform:translateY(0) scale(1); filter:saturate(1) contrast(1)} 48%{transform:translateY(-1px) scale(1.045); filter:saturate(1.08) contrast(1.02)} }
    @keyframes personaThink { 0%,100%{transform:translateY(0) scale(1.02); filter:saturate(1.04)} 42%{transform:translateY(-1px) scale(1.105); filter:saturate(1.14)} }
    @keyframes personaAura { 0%,100%{opacity:0.20; transform:scale(0.92)} 50%{opacity:0.42; transform:scale(1.16)} }
    @keyframes personaRing { 0%,100%{opacity:0.38; transform:scale(0.96)} 50%{opacity:0.72; transform:scale(1.045)} }
    @keyframes personaFlow { 0%,100%{background-position:16% 22%} 50%{background-position:84% 74%} }
    @keyframes personaGrainShift { 0%,100%{background-position:0 0} 50%{background-position:7px 5px} }
    @keyframes personaGlimmer { 0%,100%{opacity:0.22; transform:translate3d(-5%, -4%, 0) scale(0.96)} 50%{opacity:0.38; transform:translate3d(5%, 4%, 0) scale(1.04)} }
    @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; } }
  `}} />
  );
});

// ─── IDLE HERO ────────────────────────────────────────────────────────────────
const CHIPS = [
  {
    label: "Essay test",
    hint: "Simple writing",
    prompt: "Write a short essay about the importance of clean energy.",
  },
  {
    label: "Quick summary",
    hint: "Everyday topic",
    prompt: "Summarize the benefits of daily exercise in five bullet points.",
  },
  {
    label: "Fleet rollout",
    hint: "Deployment tests",
    prompt: "Draft test cases for deploying a model update to an enterprise device fleet.",
  },
  {
    label: "Token stream",
    hint: "Streaming UX",
    prompt: "Explain how token-by-token streaming improves the inference playground experience.",
  },
];

const modelAvatarGradients = {
  text: 'radial-gradient(circle at 30% 24%, rgba(244,247,255,0.92) 0%, rgba(190,204,255,0.8) 22%, transparent 42%), radial-gradient(circle at 72% 78%, rgba(232,236,255,0.84) 0%, transparent 34%), linear-gradient(145deg,#b8c5ff 0%,#8291ee 52%,#d8e0ff 100%)',
  audio: 'radial-gradient(circle at 32% 24%, rgba(255,244,208,0.9) 0%, rgba(255,196,78,0.82) 24%, transparent 43%), radial-gradient(circle at 74% 78%, rgba(255,238,194,0.88) 0%, transparent 36%), linear-gradient(145deg,#ffcf67 0%,#ffa33e 50%,#ffe8b3 100%)',
};

const modelOptions = [
  {
    mode: 'text' as const,
    label: 'Text',
    model: 'sarvam-m',
    description: 'Text input playground',
  },
  {
    mode: 'audio' as const,
    label: 'Voice',
    model: 'saaras:v3',
    description: 'Audio input transcription',
  },
];

const personaGradient =
  'radial-gradient(circle at 25% 22%, rgba(239,232,158,0.98) 0%, rgba(136,169,70,0.82) 22%, transparent 45%), radial-gradient(circle at 78% 19%, rgba(198,209,255,0.92) 0%, rgba(128,145,236,0.78) 25%, transparent 50%), radial-gradient(circle at 72% 78%, rgba(255,195,115,0.94) 0%, rgba(229,118,82,0.78) 30%, transparent 56%), radial-gradient(circle at 29% 82%, rgba(233,126,113,0.68) 0%, transparent 44%), linear-gradient(145deg,#769d42 0%,#9baafa 39%,#efb55f 68%,#dd746b 100%)';

const personaAuraGradient =
  'radial-gradient(circle at 24% 18%, rgba(137,169,70,0.40), transparent 44%), radial-gradient(circle at 78% 18%, rgba(128,145,236,0.34), transparent 46%), radial-gradient(circle at 68% 80%, rgba(229,118,82,0.38), transparent 48%)';

const personaGrain =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.16) 0 0.35px, transparent 0.6px), radial-gradient(circle at 72% 34%, rgba(24,24,24,0.14) 0 0.35px, transparent 0.6px), radial-gradient(circle at 42% 76%, rgba(255,255,255,0.12) 0 0.35px, transparent 0.6px), radial-gradient(circle at 84% 82%, rgba(24,24,24,0.10) 0 0.35px, transparent 0.6px)';

function ModelAvatar({ mode, size = 'sm' }: { mode: 'text' | 'audio'; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`shrink-0 rounded-full border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 ${size === 'md' ? 'h-7 w-7' : 'h-4 w-4'}`}
      style={{ background: modelAvatarGradients[mode] }}
    />
  );
}

function ModelSelector({
  inputMode,
  onSelect,
  disabled,
}: {
  inputMode: 'text' | 'audio';
  onSelect: (mode: 'text' | 'audio') => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const activeOption = modelOptions.find((option) => option.mode === inputMode) ?? modelOptions[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectModel = (mode: 'text' | 'audio') => {
    if (disabled) return;
    onSelect(mode);
    setOpen(false);
  };

  return (
    <div ref={selectorRef} className="relative min-w-0 flex-1 sm:mr-1 sm:flex-none">
      <button
        type="button"
        onClick={() => !disabled && setOpen((value) => !value)}
        disabled={disabled}
        className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-full border border-black/5 bg-[#f4f4f5] px-3 py-1.5 text-left font-['Geist'] text-[13px] text-[#71717a] shadow-sm transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#27272a]/50 dark:text-[#a1a1aa] dark:hover:bg-white/5 sm:min-w-[176px]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ModelAvatar mode={activeOption.mode} size="md" />
        <span className="flex min-w-0 flex-1 flex-col justify-center leading-none">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">{activeOption.model}</span>
          <span className="mt-1 font-medium text-[10px] tracking-[-0.01em] text-[#71717a]">{activeOption.label} model</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-40 mb-2 w-full min-w-[220px] overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#18181b] dark:shadow-[0_18px_48px_rgba(0,0,0,0.42)] sm:left-auto sm:right-0 sm:w-[244px]"
        >
          <div className="px-2 pb-1 pt-1.5 font-medium text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
            Select model
          </div>
          {modelOptions.map((option) => {
            const isSelected = option.mode === inputMode;
            return (
              <button
                key={option.mode}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => selectModel(option.mode)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f4f4f5] dark:hover:bg-[#27272a]"
              >
                <ModelAvatar mode={option.mode} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-['Geist'] text-[13px] font-medium tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">{option.model}</span>
                    <span className="rounded-md bg-[#f4f4f5] px-1.5 py-0.5 font-medium text-[9px] uppercase tracking-[0.08em] text-[#71717a] dark:bg-[#27272a]">
                      {option.label}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-['Geist'] text-[11px] tracking-[-0.01em] text-[#71717a]">{option.description}</span>
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-[#09090b] dark:text-[#fafafa]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type PersonaAvatarState = 'idle' | 'thinking' | 'streaming' | 'done';

function PersonaAvatar({ state = 'idle', size = 28 }: { state?: PersonaAvatarState; size?: number }) {
  const active = state === 'thinking' || state === 'streaming';
  const isLarge = size >= 48;
  const breathAnimation = active
    ? 'personaThink 1.55s cubic-bezier(0.37,0,0.23,1) infinite'
    : 'personaBreathe 4.9s cubic-bezier(0.37,0,0.23,1) infinite';
  const auraAnimation = active ? 'personaAura 2.4s ease-in-out infinite' : 'personaAura 5.2s ease-in-out infinite';
  const flowAnimation = active ? 'personaFlow 5.8s ease-in-out infinite' : 'personaFlow 9.5s ease-in-out infinite';

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size, animation: breathAnimation }}
      aria-hidden="true"
    >
      <span
        className={`pointer-events-none absolute rounded-full ${isLarge ? '-inset-1 opacity-55 blur-[3px]' : '-inset-2 blur-[7px]'}`}
        style={{
          background: personaAuraGradient,
          animation: auraAnimation,
        }}
      />
      <span
        className={`pointer-events-none absolute rounded-full border border-white/55 dark:border-white/15 ${isLarge ? '-inset-px' : '-inset-[2px]'}`}
        style={{ animation: 'personaRing 4.9s ease-in-out infinite' }}
      />
      <span
        className={`relative block h-full w-full overflow-hidden rounded-full border border-white/70 dark:border-white/10 ${
          isLarge
            ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.62),inset_0_-10px_16px_rgba(49,41,27,0.08),0_8px_18px_rgba(15,23,42,0.12)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-10px_16px_rgba(0,0,0,0.18),0_10px_20px_rgba(0,0,0,0.26)]'
            : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.54),inset_0_-12px_18px_rgba(49,41,27,0.10),0_9px_18px_rgba(15,23,42,0.10)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-12px_18px_rgba(0,0,0,0.24),0_10px_22px_rgba(0,0,0,0.28)]'
        }`}
        style={{
          background: personaGradient,
          backgroundSize: isLarge ? '150% 150%' : '190% 190%',
          animation: flowAnimation,
        }}
      >
        <span
          className={`pointer-events-none absolute inset-0 mix-blend-overlay ${isLarge ? 'opacity-25' : 'opacity-35'}`}
          style={{ backgroundImage: personaGrain, backgroundSize: '6px 6px', animation: 'personaGrainShift 7s steps(2,end) infinite' }}
        />
        <span className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(0,0,0,0.08))] ${isLarge ? 'opacity-70' : 'opacity-90'}`} />
        <span
          className={`pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_62%)] mix-blend-soft-light ${isLarge ? 'opacity-35' : 'opacity-55'}`}
          style={{ animation: 'personaGlimmer 6.2s ease-in-out infinite' }}
        />
      </span>
    </div>
  );
}

const IdleHero = memo(function IdleHero({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden gap-6 py-6 sm:gap-7 lg:-mt-12">
      <div className="text-center relative animate-[fadeUp_0.4s_ease]">
        <h1 className="font-['Geist'] text-[23px] font-semibold text-[#09090b] dark:text-[#fafafa] tracking-[-0.03em] mb-2 leading-[1.2] sm:text-[26px]">How can I help you today?</h1>
      </div>
      <div className="relative animate-[fadeUp_0.45s_ease]">
        <PersonaAvatar state="idle" size={58} />
      </div>
      <div className="relative flex w-full max-w-[640px] flex-col items-center gap-3">
        <div className="text-[12px] font-medium tracking-[-0.01em] text-[#71717a]">Try with an example</div>
        <div className="grid w-full grid-cols-2 gap-1.5 px-0 sm:gap-2.5 sm:px-4">
          {CHIPS.map((c, i) => (
            <button
              key={c.label}
              onClick={() => onChip(c.prompt)}
              className="group min-h-[52px] rounded-[12px] border border-black/5 bg-[#fafafa] px-2.5 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/10 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-[#18181b] dark:hover:border-white/20 dark:hover:bg-[#202024] sm:min-h-0 sm:rounded-[16px] sm:px-4 sm:py-3"
              style={{ animation: `fadeUp ${0.3 + i * 0.06}s ease` }}
            >
              <span className="block truncate text-[11px] font-medium tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa] sm:text-[13px]">{c.label}</span>
              <span className="mt-0.5 block truncate text-[9px] font-medium tracking-[-0.01em] text-[#71717a] sm:mt-1 sm:text-[11px]">{c.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── THINKING PERSONA ─────────────────────────────────────────────────────────
function ThinkingPersona({ state, streamedText }: { state: 'idle'|'thinking'|'streaming'|'done', streamedText: string }) {
  const isThinking  = state === "thinking";
  const isStreaming  = state === "streaming";
  const showDots    = isThinking;
  const showText    = isStreaming || state === "done";
  const showCursor  = isStreaming;

  return (
    <div className="flex gap-2.5 items-start animate-[fadeUp_0.2s_ease]">
      <PersonaAvatar state={state} />

      {/* Bubble */}
      <div className={`max-w-[86%] break-words bg-[#fafafa] dark:bg-[#18181b] border border-black/5 dark:border-white/10 rounded-[3px_12px_12px_12px] text-sm leading-[1.75] text-[#09090b] dark:text-[#fafafa] font-['Geist'] animate-[fadeIn_0.18s_ease] tracking-[-0.01em] shadow-sm sm:max-w-[78%] ${showDots ? 'px-4 py-[11px] min-w-[68px]' : 'px-4 py-2.5'}`}>
        {showDots && (
          <>
            <div className="flex gap-[5px] items-center h-[18px]" aria-hidden="true">
              {[0, 140, 280].map(d => <div key={d} className="w-[5px] h-[5px] rounded-full bg-[#71717a] opacity-60" style={{ animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: `${d}ms` }} />)}
            </div>
            <span className="sr-only">Sarvam is thinking</span>
          </>
        )}
        {showText && (
          <>
            <AssistantMarkdown content={streamedText} streaming={showCursor} />
            {showCursor && <span className="sr-only">Streaming response</span>}
          </>
        )}
      </div>
    </div>
  );
}

type SidebarMetrics = { tokens: number; tps: number; elapsed: number };
type RightSidebarProps = {
  metrics: SidebarMetrics;
  isStreaming: boolean;
  isThinking: boolean;
  model: string;
  mode: 'text' | 'audio';
};

type MetricRowProps = {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  live?: boolean;
  isIdle?: boolean;
  statusColor?: string;
};

function MetricRow({ label, value, mono, accent, live, isIdle = true, statusColor = 'transparent' }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/10 last:border-0">
      <span className="font-['Geist'] text-xs text-[#71717a] tracking-[-0.01em]">{label}</span>
      <div className="flex items-center gap-1.5">
        {live && !isIdle && <div className="w-[5px] h-[5px] rounded-full animate-[statusGlow_1s_ease_infinite]" style={{ background: statusColor }} />}
        <span className={`text-xs font-medium transition-all ${mono ? "tracking-normal" : "font-['Geist'] tracking-[-0.01em]"} ${accent ? "bg-[linear-gradient(135deg,#2563eb,#f97316)] bg-clip-text text-transparent" : "text-[#09090b] dark:text-[#fafafa]"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

type BigMetricProps = {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
};

function BigMetric({ label, value, unit, accent }: BigMetricProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[10px] border border-black/5 bg-[#fafafa] p-[12px_14px] shadow-sm dark:border-white/10 dark:bg-[#18181b]">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 truncate font-['Geist'] text-[11px] font-medium uppercase tracking-wide text-[#71717a]">{label}</div>
        {unit && (
          <div className="shrink-0 rounded-md bg-[#f4f4f5] px-1.5 py-0.5 font-medium text-[10px] text-[#71717a] dark:bg-[#27272a]">
            {unit}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <span className={`block max-w-full break-all font-medium text-[28px] leading-none tracking-normal tabular-nums transition-all ${accent ? "bg-[linear-gradient(135deg,#2563eb,#f97316)] bg-clip-text text-transparent" : "text-[#09090b] dark:text-[#fafafa]"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function CompactMetricsBar({
  metrics,
  isStreaming,
  isThinking,
}: {
  metrics: SidebarMetrics;
  isStreaming: boolean;
  isThinking: boolean;
}) {
  const isActive = isStreaming || isThinking;
  const items = [
    { label: 'Tokens', value: metrics.tokens > 0 ? String(metrics.tokens) : '—', unit: '' },
    { label: 'Speed', value: metrics.tps > 0 ? String(metrics.tps) : '—', unit: metrics.tps > 0 ? 'tok/s' : '' },
    { label: 'Elapsed', value: metrics.elapsed > 0 ? String(metrics.elapsed) : '—', unit: metrics.elapsed > 0 ? 's' : '' },
  ];

  return (
    <section className="border-b border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f0f12] lg:hidden">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">Live Metrics</span>
        <span className="text-[10px] font-medium text-[#71717a]">
          {isActive ? (isThinking ? 'Preparing' : 'Streaming') : 'Start prompting to see updates'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 rounded-[10px] border border-black/5 bg-[#fafafa] px-3 py-2 shadow-sm dark:border-white/10 dark:bg-[#18181b]">
            <div className="truncate text-[10px] font-medium text-[#71717a]">{item.label}</div>
            <div className="mt-1 flex min-w-0 items-baseline gap-1">
              <span className="truncate text-[17px] font-semibold leading-none tracking-normal text-[#09090b] dark:text-[#fafafa]">{item.value}</span>
              {item.unit && <span className="shrink-0 text-[9px] font-medium text-[#71717a]">{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccordionSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 cursor-pointer group outline-none"
      >
        <span className="font-['Geist'] text-[11px] font-semibold text-[#71717a] tracking-wider uppercase transition-colors group-hover:text-[#09090b] dark:group-hover:text-[#fafafa]">
          {title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#71717a] transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="bg-[#f4f4f5] dark:bg-[#0f0f12] border border-black/5 dark:border-white/10 rounded-[10px] px-3 py-0.5 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RIGHT SIDEBAR (METRICS) ──────────────────────────────────────────────────
function RightSidebar({ metrics, isStreaming, isThinking, model, mode }: RightSidebarProps) {
  const isIdle = !isStreaming && !isThinking;
  const hasMetrics = metrics.tokens > 0 || metrics.elapsed > 0 || metrics.tps > 0;
  const statusColor = isThinking ? "#f97316" : isStreaming ? "#22c55e" : "transparent";

  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col overflow-hidden border-l border-black/5 bg-[#fafafa] dark:border-white/10 dark:bg-[#09090b] lg:flex xl:w-[260px]">
      
      {/* Header */}
      <div className="flex min-h-[68px] shrink-0 items-center justify-between gap-3 border-b border-black/5 px-5 py-3 dark:border-white/10">
        <div className="flex min-w-0 flex-col justify-center gap-0.5">
          <span className="font-['Geist'] text-[15px] font-semibold tracking-[-0.02em] text-[#09090b] dark:text-[#fafafa]">Live Metrics</span>
          <span className="truncate font-medium text-[10px] text-[#71717a]">Token counter, speed, and elapsed time.</span>
        </div>
        
        {/* Dynamic Status Pill (Only shows when active) */}
        {!isIdle && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#f4f4f5] px-2 py-[3px] font-medium text-[10px] shadow-sm animate-[fadeIn_0.2s_ease] dark:bg-[#27272a]" style={{ color: statusColor }}>
            <div className={`w-[5px] h-[5px] rounded-full animate-[statusGlow_1s_ease_infinite]`} style={{ background: statusColor }} />
            {isThinking ? 'Preparing' : 'Streaming'}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isIdle && !hasMetrics && (
          <div className="relative isolate mb-4 overflow-hidden rounded-[12px] border border-black/5 bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-[#18181b]">
            <span
              className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay dark:opacity-30"
              style={{ backgroundImage: personaGrain, backgroundSize: '6px 6px' }}
              aria-hidden="true"
            />
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(136,169,70,0.13),transparent_34%),radial-gradient(circle_at_85%_90%,rgba(229,118,82,0.12),transparent_38%)] dark:bg-[radial-gradient(circle_at_20%_8%,rgba(136,169,70,0.18),transparent_34%),radial-gradient(circle_at_85%_90%,rgba(229,118,82,0.18),transparent_38%)]" aria-hidden="true" />
            <div className="relative z-10 text-[12px] font-medium tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">Start with a prompt</div>
            <p className="relative z-10 mt-1 text-[11px] font-medium leading-5 tracking-[-0.01em] text-[#71717a]">
              Send a text prompt or record audio to see the live token counter and speed update in real time.
            </p>
          </div>
        )}

        
        {/* PRIMARY METRICS: Assignment Rubric Focus */}
        <div className="mb-6 flex flex-col gap-2.5">
          <BigMetric 
            label="Tokens Generated" 
            value={metrics.tokens > 0 ? metrics.tokens : "—"} 
            accent={metrics.tokens > 0} 
          />
          <BigMetric 
            label="Speed" 
            value={metrics.tps > 0 ? metrics.tps : "—"} 
            unit={metrics.tps > 0 ? "tok/s" : ""} 
            accent={metrics.tps > 0} 
          />
          <BigMetric 
            label="Elapsed" 
            value={metrics.elapsed > 0 ? metrics.elapsed : "—"} 
            unit={metrics.elapsed > 0 ? "s" : ""} 
          />
        </div>

        {/* COLLAPSIBLE CONFIGURATION */}
        <AccordionSection title="Multi-Modal Input" defaultOpen={true}>
          <MetricRow label="Active Model" value={model} mono />
          <MetricRow label="Input Mode"   value={mode === 'text' ? 'Text' : 'Audio'} mono={false} />
        </AccordionSection>

        {/* COLLAPSIBLE RUNTIME */}
        <AccordionSection title="Streaming Response">
          <MetricRow label="Provider"  value="Sarvam AI" mono={false} />
          <MetricRow label="Context"   value="32k tokens" mono />
          <MetricRow label="Latency"   value="~80ms"      mono />
          <MetricRow label="Stream"    value="SSE (Fetch)" mono />
        </AccordionSection>

        {/* COLLAPSIBLE ENDPOINT */}
        <AccordionSection title="Endpoint">
          <MetricRow label="Base URL" value="api.sarvam.ai" mono />
          <MetricRow label="Route"    value="/v1/chat"      mono />
          <MetricRow label="Method"   value="POST"          mono />
        </AccordionSection>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.4); }
      `}} />
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
  const mounted = useIsHydrated();

  const { setOutput, isStreaming, metrics, startStream, stopStream } = useStream();
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

  const resizePromptInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 32), 128);
    const nextHeightValue = `${nextHeight}px`;

    if (textarea.style.height !== nextHeightValue) {
      textarea.style.height = nextHeightValue;
    }

    textarea.style.overflowY = textarea.scrollHeight > 128 ? 'auto' : 'hidden';
  }, []);

  useLayoutEffect(() => {
    if (inputMode === 'text') resizePromptInput();
  }, [inputMode, promptText, resizePromptInput]);

  const sendPrompt = useCallback((textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;
    const userMessage: ChatMessage = { id: createMessageId(), role: 'user', content: textToSend.trim() };
    const assistantMessage: ChatMessage = { id: createMessageId(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setPromptText(''); setElapsedMs(0); setOutput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '32px';
      textareaRef.current.style.overflowY = 'hidden';
    }
    
    const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
    void startStream(apiMessages, {
      onToken: (token) => {
        setMessages(current => current.map(m => m.id === assistantMessage.id ? { ...m, content: m.content + token } : m));
      },
    });
  }, [isStreaming, messages, setOutput, startStream]);

  const handleSubmit = useCallback((overrideText?: string) => {
    sendPrompt(overrideText ?? promptText);
  }, [promptText, sendPrompt]);

  const handleComposerAction = useCallback(() => {
    if (isStreaming) {
      stopStream();
      return;
    }

    handleSubmit();
  }, [handleSubmit, isStreaming, stopStream]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };

  const { startRecording, stopRecording, isRecording, isTranscribing, audioError } = useAudioRecord((transcript) => {
    setPromptText(transcript); setInputMode('text');
  });

  const handleTextMode = () => {
    if (isRecording || isTranscribing) return;
    setInputMode('text');
  };

  const handleAudioMode = () => {
    if (isStreaming || isThinking || isTranscribing) return;

    setInputMode('audio');
    if (isRecording) {
      stopRecording();
      return;
    }

    void startRecording();
  };

  const handleModelSelect = (mode: 'text' | 'audio') => {
    if (isStreaming || isThinking || isRecording || isTranscribing) return;
    setInputMode(mode);
  };

  const secondsElapsed = elapsedMs / 1000;
  const speed = metrics.tokenCount > 0 && secondsElapsed > 0 ? `${(metrics.tokenCount / secondsElapsed).toFixed(1)}` : '—';
  const latency = metrics.startTime > 0 && elapsedMs > 0 ? `${secondsElapsed.toFixed(2)}` : '—';
  const currentTheme = mounted && theme === 'system' ? systemTheme : theme;
  const canSend = Boolean(promptText.trim()) && !isStreaming && !isThinking && !isRecording && !isTranscribing;
  const sidebarMetrics = {
    tokens: metrics.tokenCount,
    tps: speed !== '—' ? Number(speed) : 0,
    elapsed: latency !== '—' ? Number(latency) : 0,
  };

  return (
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-hidden bg-white font-sans dark:bg-[#09090b] lg:h-screen">
      <GlobalStyles />
      
      {/* ─── CENTER CHAT AREA ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0f0f12]">
        
        {/* Header */}
        <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-4 border-b border-black/5 bg-[#fafafa] px-4 py-3 dark:border-white/10 dark:bg-[#09090b] sm:min-h-[68px] sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col justify-center gap-0.5">
            <h1 className="font-['Geist'] text-[15px] font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">Inference Playground</h1>
            <p className="mt-0.5 hidden truncate font-medium text-[10px] text-[#71717a] sm:block">
              Test on-device inference with text input, audio input, and live token streaming.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link
              href="/documentation"
              className="rounded-[7px] border border-black/5 bg-transparent px-3 py-[5px] font-['Geist'] text-xs tracking-normal text-[#71717a] transition-all hover:border-black/10 hover:text-[#09090b] dark:border-white/10 dark:hover:border-white/20 dark:hover:text-[#fafafa]"
            >
              Docs
            </Link>
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

        <CompactMetricsBar metrics={sidebarMetrics} isStreaming={isStreaming} isThinking={isThinking} />

        {/* Chat Area */}
        <div
          className="relative flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:p-5"
          aria-live="polite"
          aria-label="Chat conversation"
          aria-atomic="false"
        >
          {messages.length === 0 && !isStreaming ? (
            <IdleHero onChip={sendPrompt} />
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
                      <div className="max-w-[86%] break-words bg-[#f4f4f5] dark:bg-[#18181b] border border-black/5 dark:border-white/10 rounded-[12px_12px_3px_12px] px-[14px] py-[9px] text-[14px] leading-[1.7] text-[#09090b] dark:text-[#fafafa] font-['Geist'] tracking-[-0.01em] shadow-sm sm:max-w-[76%]">
                        {m.content}
                      </div>
                    </div>
                  );
                }
                if (isLastStreaming) return <ThinkingPersona key={m.id} state={personaState} streamedText={m.content} />;
                return (
                  <div key={m.id} className="flex gap-2 items-start animate-[fadeUp_0.18s_ease]">
                    <PersonaAvatar state="idle" size={26} />
                    <div className="max-w-[86%] break-words py-[2px] font-['Geist'] sm:max-w-[78%]">
                      <AssistantMarkdown content={m.content} />
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} className="h-4" />
            </div>
          )}
        </div>

        {/* ─── ENHANCED INPUT BOX ─── */}
        <div className="relative z-10 mx-auto mb-2 w-full max-w-4xl shrink-0 px-3 pb-4 pt-2 sm:mb-4 sm:px-4 sm:pb-8">
          
          {/* Glowing Gradient Background - Stronger opacity and larger range */}
       {/* Light mode sunrise glow */}
<div className="absolute top-[-20px] left-[-30px] right-[-30px] h-[180px] rounded-full bg-gradient-to-b from-orange-500/80 via-[#f0a37f]/65 via-40% to-[#bfc4ff]/45 blur-[80px] transition-opacity duration-500 dark:hidden -z-10 pointer-events-none" />

<div className="absolute top-[-10px] left-10 right-10 h-[120px] rounded-full bg-gradient-to-b from-[#ff7a18]/70 via-[#ffb36b]/55 to-transparent blur-[55px] opacity-90 dark:hidden pointer-events-none -z-10" />

<div className="absolute top-[40px] left-0 right-0 h-[140px] rounded-full bg-gradient-to-b from-[#c8cbff]/40 via-[#d9c2ff]/25 to-transparent blur-[70px] opacity-80 dark:hidden pointer-events-none -z-10" />

{/* Dark mode original glow */}
<div className="absolute bottom-[-8px] left-4 right-4 h-24 rounded-full bg-gradient-to-r from-blue-600/40 via-purple-600/55 to-orange-500/55 blur-[42px] transition-opacity duration-500 hidden dark:block dark:from-blue-600/50 dark:via-purple-600/65 dark:to-orange-500/65 sm:bottom-[-10px] sm:left-[-20px] sm:right-[-20px] sm:h-[140px] sm:blur-[60px] -z-10 pointer-events-none" />

<div className="flex flex-col overflow-visible rounded-[24px] border border-black/10 bg-[#fafafa] shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-colors focus-within:border-black/20 dark:border-white/10 dark:bg-[#18181b] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] dark:focus-within:border-white/20 sm:rounded-[32px]">
            {/* Top Textarea Section */}
            <div className="min-h-[58px] px-4 pb-1 pt-4 sm:px-5">
              {inputMode === 'text' ? (
                <textarea
                  ref={textareaRef}
                  value={promptText}
                  onChange={handleInput}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Ask anything..."
                  className="block w-full resize-none overflow-hidden bg-transparent outline-none text-[15px] leading-[1.65] font-['Geist'] text-[#09090b] dark:text-[#fafafa] placeholder:text-[#a1a1aa] dark:placeholder:text-[#52525b] min-h-[32px] max-h-[128px] caret-[#f97316] tracking-[-0.01em]"
                  disabled={isStreaming || isThinking}
                  rows={1}
                />
              ) : (
                <div className="min-h-[32px] flex items-center text-[15px] font-['Geist'] tracking-[-0.01em]">
                  {audioError ? <span className="text-red-500">{audioError}</span> : isTranscribing ? <span className="text-blue-500 font-medium">Transcribing audio...</span> : isRecording ? <span className="text-red-500 animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Recording...</span> : <span className="text-[#a1a1aa] dark:text-[#52525b]">Tap mic to record audio</span>}
                </div>
              )}
            </div>

            {/* Bottom Toolbar Section */}
            <div className="flex flex-col gap-2 px-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Left Side: Plus Icon & Helper Text */}
              <div className="flex items-center gap-3 pl-1">
                <button
                  type="button"
                  disabled
                  aria-hidden="true"
                  tabIndex={-1}
                  className="hidden w-9 h-9 rounded-full border border-black/5 dark:border-white/5 items-center justify-center text-[#71717a] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
                <span className="hidden select-none font-['Geist'] text-[11px] text-[#a1a1aa] opacity-80 dark:text-[#52525b] md:inline-block">
                  Press <kbd className="font-medium text-[9px] px-1 py-0.5 rounded-sm border border-black/10 dark:border-white/10 mx-0.5">Shift</kbd> + <kbd className="font-medium text-[9px] px-1 py-0.5 rounded-sm border border-black/10 dark:border-white/10 mx-0.5">Enter</kbd> for new line
                </span>
              </div>
              
              {/* Right Side: Tools & Send */}
              <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:flex-nowrap">
                
                <ModelSelector
                  inputMode={inputMode}
                  onSelect={handleModelSelect}
                  disabled={isStreaming || isThinking || isRecording || isTranscribing}
                />

                {/* Input Mode Toggle */}
                <div className="inline-flex h-10 shrink-0 items-center rounded-full border border-black/5 bg-[#f4f4f5] p-0.5 shadow-sm dark:border-white/10 dark:bg-[#27272a]/50">
                  <button 
                    type="button"
                    onClick={handleTextMode}
                    disabled={isRecording || isTranscribing}
                    className={`grid h-9 w-9 place-items-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40 ${inputMode === 'text' ? 'bg-white text-[#09090b] shadow-sm dark:bg-[#18181b] dark:text-[#fafafa]' : 'text-[#71717a] dark:text-[#a1a1aa] hover:bg-white/70 hover:text-[#09090b] dark:hover:bg-[#18181b] dark:hover:text-[#fafafa]'}`}
                    aria-label="Use text input"
                  >
                    <Keyboard className="w-4.5 h-4.5" />
                  </button>

                  <button 
                    type="button"
                    onClick={handleAudioMode}
                    disabled={isTranscribing || isStreaming || isThinking}
                    className={`grid h-9 w-9 place-items-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40 ${inputMode === 'audio' ? (isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.42)]' : 'bg-white text-[#09090b] shadow-sm dark:bg-[#18181b] dark:text-[#fafafa]') : 'text-[#71717a] dark:text-[#a1a1aa] hover:bg-white/70 hover:text-[#09090b] dark:hover:bg-[#18181b] dark:hover:text-[#fafafa]'}`}
                    aria-label={isRecording ? "Stop recording" : "Start audio recording"}
                  >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4.5 h-4.5" />}
                  </button>
                </div>
                
                {/* Send Button */}
                <button 
                  type="button"
                  onClick={handleComposerAction}
                  disabled={!isStreaming && !canSend}
                  aria-label={isStreaming ? 'Stop streaming response' : 'Send prompt'}
                  className={`ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                    isStreaming
                      ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.36)] hover:scale-105 cursor-pointer border-none"
                      : canSend
                        ? "bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-[#09090b] shadow-md hover:scale-105 cursor-pointer border-none"
                        : "bg-[#f4f4f5] dark:bg-[#27272a] text-[#a1a1aa] dark:text-[#52525b] border border-black/5 dark:border-white/10 cursor-default"
                  }`}
                >
                  {isStreaming || isThinking 
                    ? <Square className="w-4 h-4 fill-current" />
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
        metrics={sidebarMetrics} 
        isStreaming={isStreaming} 
        isThinking={isThinking} 
        model={inputMode === "text" ? "sarvam-m" : "saaras:v3"} 
        mode={inputMode} 
      />
    </div>
  );
}
