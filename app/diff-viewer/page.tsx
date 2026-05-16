// src/app/diff-viewer/page.tsx
'use client';

import { useState } from 'react';
import {
  Copy,
  Database,
  Info,
  Keyboard,
  Loader2,
  Zap,
} from 'lucide-react';
import { computeDiff, DiffToken } from '../utils/diffAlgorithm';

const mockScenarios = [
  {
    label: 'Token change',
    prompt: 'Compare concise descriptions of on-device inference.',
    modelA: 'On-device inference keeps model responses fast and private for enterprise engineers.',
    modelB: 'On-device inference keeps responses faster and more private for enterprise teams.',
  },
  {
    label: 'Removal case',
    prompt: 'Compare a verbose deployment note against a shorter rewrite.',
    modelA: 'The deployment manager slowly rolls out the updated model to every registered device in the enterprise fleet.',
    modelB: 'The deployment manager rolls out the updated model to the fleet.',
  },
  {
    label: 'Model update',
    prompt: 'Explain the benefits of testing a model update before fleet deployment.',
    modelA:
      'Testing a model update before deployment helps engineering teams catch regressions early. It verifies latency, output quality, and reliability before the model reaches a device fleet. It also gives reviewers a clear record of expected behavior.',
    modelB:
      'Testing a model update before fleet deployment helps engineers detect regressions before release. It validates latency, response quality, and reliability before devices receive the new model. It also creates a clear review trail for expected behavior.',
  },
];

const GlobalStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
      `,
    }}
  />
);

const grainTexture =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.34) 0 0.7px, transparent 1px), radial-gradient(circle at 72% 34%, rgba(20,20,20,0.18) 0 0.55px, transparent 1px), radial-gradient(circle at 42% 76%, rgba(255,255,255,0.22) 0 0.65px, transparent 1px), radial-gradient(circle at 84% 82%, rgba(20,20,20,0.12) 0 0.55px, transparent 1px)';

const modelAvatarGradients = {
  blue: 'radial-gradient(circle at 30% 24%, rgba(244,247,255,0.92) 0%, rgba(190,204,255,0.8) 22%, transparent 42%), radial-gradient(circle at 72% 78%, rgba(232,236,255,0.84) 0%, transparent 34%), linear-gradient(145deg,#b8c5ff 0%,#8291ee 52%,#d8e0ff 100%)',
  orange: 'radial-gradient(circle at 32% 24%, rgba(255,244,208,0.9) 0%, rgba(255,196,78,0.82) 24%, transparent 43%), radial-gradient(circle at 74% 78%, rgba(255,238,194,0.88) 0%, transparent 36%), linear-gradient(145deg,#ffcf67 0%,#ffa33e 50%,#ffe8b3 100%)',
};

const activeToggleGradients = {
  mock: 'radial-gradient(circle at 22% 18%, rgba(226,241,170,0.88) 0%, rgba(155,185,86,0.76) 34%, transparent 58%), radial-gradient(circle at 82% 88%, rgba(238,230,169,0.9) 0%, transparent 46%), linear-gradient(135deg,#678f33 0%,#96b95d 50%,#d8d190 100%)',
  live: 'radial-gradient(circle at 24% 18%, rgba(255,202,152,0.8) 0%, rgba(214,102,77,0.62) 35%, transparent 60%), radial-gradient(circle at 82% 82%, rgba(177,91,121,0.66) 0%, transparent 45%), linear-gradient(135deg,#a64f46 0%,#cf6a54 52%,#a8577a 100%)',
};

export default function DiffViewer() {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [livePrompt, setLivePrompt] = useState(mockScenarios[2].prompt);
  const [modelAOutput, setModelAOutput] = useState(mockScenarios[2].modelA);
  const [modelBOutput, setModelBOutput] = useState(mockScenarios[2].modelB);
  const [diffResult, setDiffResult] = useState<DiffToken[] | null>(
    computeDiff(mockScenarios[2].modelA, mockScenarios[2].modelB)
  );

  const loadMockScenario = (index: number) => {
    const scenario = mockScenarios[index];
    setLivePrompt(scenario.prompt);
    setModelAOutput(scenario.modelA);
    setModelBOutput(scenario.modelB);
    setDiffResult(computeDiff(scenario.modelA, scenario.modelB));
  };

  const handleModeSwitch = (live: boolean) => {
    setIsLiveMode(live);
    setDiffResult(null);

    if (live) {
      setModelAOutput('');
      setModelBOutput('');
      return;
    }

    loadMockScenario(2);
  };

  const handleGenerateAndCompare = async () => {
    if (isLiveMode) {
      if (!livePrompt.trim()) return;
      setIsGenerating(true);
      setDiffResult(null);

      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: livePrompt }),
        });

        const data = await res.json();
        if (data.modelA && data.modelB) {
          setModelAOutput(data.modelA);
          setModelBOutput(data.modelB);
          setDiffResult(computeDiff(data.modelA, data.modelB));
        }
      } catch (error) {
        console.error('Failed to fetch live comparison', error);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setDiffResult(computeDiff(modelAOutput, modelBOutput));
  };

  const diffStats = getDiffStats(diffResult);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-['Geist'] text-[#09090b] dark:bg-[#09090b] dark:text-[#fafafa]">
      <GlobalStyles />
      <main className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#0f0f12]">
          <header className="flex h-[58px] shrink-0 items-center justify-between gap-4 border-b border-black/5 bg-[#fafafa] px-5 dark:border-white/10 dark:bg-[#09090b] sm:px-7">
            <div className="flex min-w-0 flex-col justify-center">
              <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-[#09090b] dark:text-[#fafafa]">Model Output Diff View</h1>
              <p className="mt-0.5 hidden truncate font-medium text-[10px] text-[#71717a] sm:block">
                Compare two model versions on the same prompt with token-level changed words.
              </p>
            </div>
            <ModeToggle isLiveMode={isLiveMode} onModeSwitch={handleModeSwitch} />
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 pt-4 sm:px-7">
            <PromptCard
              isLiveMode={isLiveMode}
              isGenerating={isGenerating}
              livePrompt={livePrompt}
              onPromptChange={setLivePrompt}
              onModeSwitch={handleModeSwitch}
              onScenarioSelect={loadMockScenario}
              onCompare={handleGenerateAndCompare}
            />

            <StatsCard stats={diffStats} />

            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
              <ModelCard
                title="Baseline Model"
                badge="Version A"
                tone="blue"
                modeLabel={isLiveMode ? 'temperature 0.1' : 'baseline output'}
                rawValue={modelAOutput}
                onRawChange={setModelAOutput}
                diffResult={diffResult}
                disabled={isLiveMode || isGenerating}
                side="removed"
              />
              <ModelCard
                title="Candidate Model"
                badge="Version B"
                tone="orange"
                modeLabel={isLiveMode ? 'temperature 0.2' : 'candidate output'}
                rawValue={modelBOutput}
                onRawChange={setModelBOutput}
                diffResult={diffResult}
                disabled={isLiveMode || isGenerating}
                side="added"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 text-[11px] text-[#71717a]">
              <Info className="h-3.5 w-3.5" />
              <span>
                {isLiveMode
                  ? 'Use real model compares a baseline response and a candidate response for the same prompt.'
                  : 'Sample data uses local test cases, so you can inspect token-level diffing without calling the API.'}
              </span>
            </div>
          </div>
      </main>
    </div>
  );
}

function ModeToggle({
  isLiveMode,
  onModeSwitch,
}: {
  isLiveMode: boolean;
  onModeSwitch: (value: boolean) => void;
}) {
  const mockActive = !isLiveMode;
  const liveActive = isLiveMode;

  return (
    <div className="inline-flex w-fit shrink-0 rounded-[10px] border border-black/5 bg-[#f4f4f5] p-0.5 shadow-sm dark:border-white/10 dark:bg-[#18181b]">
      <button
        type="button"
        onClick={() => onModeSwitch(false)}
        style={mockActive ? { background: activeToggleGradients.mock } : undefined}
        className={`relative isolate inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-[8px] px-3 text-xs font-medium tracking-[-0.01em] transition ${
          mockActive
            ? 'text-[#172607] shadow-[0_8px_18px_rgba(86,120,48,0.20)]'
            : 'text-[#71717a] hover:text-[#09090b] dark:hover:text-[#fafafa]'
        }`}
      >
        {mockActive && <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: grainTexture, backgroundSize: '7px 7px' }} />}
        <Database className="relative z-10 h-3.5 w-3.5" />
        <span className="relative z-10">Sample data</span>
      </button>
      <button
        type="button"
        onClick={() => onModeSwitch(true)}
        style={liveActive ? { background: activeToggleGradients.live } : undefined}
        className={`relative isolate inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-[8px] px-3 text-xs font-medium tracking-[-0.01em] transition ${
          liveActive
            ? 'text-white shadow-[0_8px_18px_rgba(148,74,68,0.22)]'
            : 'text-[#71717a] hover:text-[#09090b] dark:hover:text-[#fafafa]'
        }`}
      >
        {liveActive && <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: grainTexture, backgroundSize: '7px 7px' }} />}
        <Zap className="relative z-10 h-3.5 w-3.5" />
        <span className="relative z-10">Use real model</span>
      </button>
    </div>
  );
}

function GradientAvatar({ tone }: { tone: 'blue' | 'orange' }) {
  return (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_18px_rgba(15,23,42,0.10)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_22px_rgba(0,0,0,0.24)]" style={{ background: modelAvatarGradients[tone] }}>
      <span className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: grainTexture, backgroundSize: '6px 6px' }} />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.24),transparent_32%)]" />
    </div>
  );
}

function PromptCard({
  isLiveMode,
  isGenerating,
  livePrompt,
  onPromptChange,
  onModeSwitch,
  onScenarioSelect,
  onCompare,
}: {
  isLiveMode: boolean;
  isGenerating: boolean;
  livePrompt: string;
  onPromptChange: (value: string) => void;
  onModeSwitch: (value: boolean) => void;
  onScenarioSelect: (index: number) => void;
  onCompare: () => void;
}) {
  const activateLiveMode = () => {
    if (!isLiveMode && !isGenerating) onModeSwitch(true);
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isLiveMode) onModeSwitch(true);
    onPromptChange(event.target.value);
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();

    if (!isLiveMode) {
      activateLiveMode();
      return;
    }

    if (livePrompt.trim() && !isGenerating) onCompare();
  };

  return (
    <div className="relative isolate shrink-0 overflow-hidden rounded-[24px] border border-black/10 bg-[#fafafa] p-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#18181b] dark:shadow-[0_14px_42px_rgba(0,0,0,0.34)]">
      <div className="pointer-events-none absolute inset-x-8 -bottom-12 h-28 rounded-full bg-[linear-gradient(90deg,rgba(37,99,235,0.22),rgba(168,85,247,0.26),rgba(249,115,22,0.22))] blur-3xl dark:bg-[linear-gradient(90deg,rgba(37,99,235,0.28),rgba(168,85,247,0.34),rgba(249,115,22,0.30))]" />
      <div className="relative z-10">
        <div className="min-w-0">
          <div
            onClick={activateLiveMode}
            className={`rounded-[22px] border px-4 pb-3 pt-3 shadow-sm transition dark:bg-[#0f0f12] ${
              isLiveMode
                ? 'border-black/15 bg-white focus-within:border-black/25 dark:border-white/15 dark:focus-within:border-white/25'
                : 'border-black/5 bg-white/60 opacity-75 hover:border-black/15 hover:opacity-100 dark:border-white/10 dark:bg-[#0f0f12]/65 dark:hover:border-white/20'
            }`}
          >
            <label htmlFor="diff-prompt" className="font-medium text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
              {isLiveMode ? 'Prompt' : 'Prompt preview'}
            </label>
            <textarea
              id="diff-prompt"
              value={livePrompt}
              onFocus={activateLiveMode}
              onChange={handlePromptChange}
              onKeyDown={handlePromptKeyDown}
              disabled={isGenerating}
              className="mt-2 min-h-[54px] w-full resize-none bg-transparent text-[15px] leading-[1.65] tracking-[-0.01em] text-[#09090b] outline-none placeholder:text-[#a1a1aa] disabled:text-[#71717a] dark:text-[#fafafa] dark:placeholder:text-[#52525b] dark:disabled:text-[#71717a]"
              placeholder="Explain the benefits of using AI in education."
              rows={2}
            />
            <div className="mt-3 flex flex-col gap-3 border-t border-black/5 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[#71717a]">
                <Keyboard className="h-3.5 w-3.5" />
                <span>
                  {isLiveMode ? 'Enter to send · Shift + Enter for new line' : 'Click an example, or click here to use the real model'}
                </span>
              </div>
              {isLiveMode && (
                <button
                  type="button"
                  onClick={onCompare}
                  disabled={isGenerating || !livePrompt.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#09090b] px-5 text-sm font-semibold tracking-[-0.01em] text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fafafa] dark:text-[#09090b]"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate and compare'}
                </button>
              )}
            </div>
          </div>

          {!isLiveMode && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[14px] border border-black/5 bg-white/70 p-2.5 shadow-sm dark:border-white/10 dark:bg-[#0f0f12]">
              <span className="px-1 text-[11px] font-medium tracking-[-0.01em] text-[#71717a]">Try an example</span>
              {mockScenarios.map((scenario, index) => (
                <button
                  key={scenario.label}
                  type="button"
                  onClick={() => onScenarioSelect(index)}
                  className="rounded-lg border border-black/5 bg-white px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-[#71717a] shadow-sm transition hover:border-black/10 hover:bg-[#f4f4f5] hover:text-[#09090b] dark:border-white/10 dark:bg-[#18181b] dark:hover:border-white/20 dark:hover:bg-[#27272a] dark:hover:text-[#fafafa]"
                >
                  {scenario.label}
                  <span className="sr-only"> example {index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ stats }: { stats: ReturnType<typeof getDiffStats> }) {
  const metrics = [
    { label: 'Total Tokens', value: String(stats.total), sub: '', color: 'text-slate-950 dark:text-white' },
    { label: 'Added', value: `+ ${stats.added}`, sub: `${stats.addedPct}%`, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Removed', value: `- ${stats.removed}`, sub: `${stats.removedPct}%`, color: 'text-red-600 dark:text-red-400' },
    { label: 'Unchanged', value: String(stats.unchanged), sub: `${stats.unchangedPct}%`, color: 'text-slate-950 dark:text-white' },
    { label: 'Similarity', value: `${stats.similarity}%`, sub: '', color: 'text-[#5161ff] dark:text-[#7b73ff]' },
  ];

  return (
    <div className="grid shrink-0 gap-3 rounded-[12px] border border-black/5 bg-[#fafafa] p-3.5 shadow-sm dark:border-white/10 dark:bg-[#0f0f12] sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`px-3 ${index > 0 ? 'border-black/5 dark:border-white/10 xl:border-l' : ''}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-[-0.01em] text-[#71717a]">
            {metric.label}
            {metric.label === 'Similarity' && <Info className="h-3 w-3" />}
          </div>
          <div className={`mt-1 font-medium text-xl font-semibold tracking-normal ${metric.color}`}>{metric.value}</div>
          {metric.sub && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#71717a]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  metric.label === 'Added' ? 'bg-emerald-500' : metric.label === 'Removed' ? 'bg-red-500' : 'bg-slate-400'
                }`}
              />
              {metric.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ModelCard({
  title,
  badge,
  tone,
  modeLabel,
  rawValue,
  onRawChange,
  diffResult,
  disabled,
  side,
}: {
  title: string;
  badge: string;
  tone: 'blue' | 'orange';
  modeLabel: string;
  rawValue: string;
  onRawChange: (value: string) => void;
  diffResult: DiffToken[] | null;
  disabled: boolean;
  side: 'removed' | 'added';
}) {
  const isBlue = tone === 'blue';
  const [viewMode, setViewMode] = useState<'diff' | 'text'>('diff');
  const showDiff = diffResult && viewMode === 'diff';

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[12px] border border-black/5 bg-[#fafafa] shadow-sm dark:border-white/10 dark:bg-[#000000] ">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 dark:border-white/10   dark:bg-[#0f0f12]">
        <div className="flex items-center gap-3">
          <GradientAvatar tone={tone} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">{title}</h2>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium tracking-[-0.01em] ${
                  isBlue ? 'bg-blue-50 text-[#2563eb] dark:bg-[#27272a] dark:text-[#60a5fa]' : 'bg-orange-50 text-orange-600 dark:bg-[#27272a] dark:text-[#fb923c]'
                }`}
              >
                {badge}
              </span>
            </div>
            <p className="mt-0.5 font-medium text-[11px] text-[#71717a]">{modeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {diffResult && (
            <div className="inline-flex rounded-[9px] border border-black/5 bg-[#f4f4f5] p-0.5 dark:border-white/10 dark:bg-[#18181b]">
              {(['diff', 'text'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`h-7 rounded-[7px] px-2.5 text-[11px] font-medium tracking-[-0.01em] transition ${
                    viewMode === mode
                      ? 'bg-white text-[#09090b] shadow-sm dark:bg-[#27272a] dark:text-[#fafafa]'
                      : 'text-[#71717a] hover:text-[#09090b] dark:hover:text-[#fafafa]'
                  }`}
                >
                  {mode === 'diff' ? 'Diff' : 'Text'}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-[8px] text-[#71717a] transition hover:bg-[#f4f4f5] hover:text-[#09090b] dark:hover:bg-[#27272a] dark:hover:text-[#fafafa]"
            aria-label={`Copy ${title} output`}
            onClick={() => navigator.clipboard?.writeText(rawValue)}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 font-medium text-xs leading-6 text-[#09090b] dark:text-[#fafafa]">
        {showDiff ? (
          <HighlightedDiff diffResult={diffResult} side={side} />
        ) : diffResult ? (
          <div className="whitespace-pre-wrap">{rawValue}</div>
        ) : (
          <textarea
            value={rawValue}
            onChange={(event) => onRawChange(event.target.value)}
            disabled={disabled}
            placeholder={disabled ? 'Run Compare to generate output.' : 'Paste or edit model output here.'}
            className="h-full min-h-[220px] w-full resize-none bg-transparent text-xs leading-6 text-[#09090b] outline-none placeholder:text-[#a1a1aa] disabled:text-[#71717a] dark:text-[#fafafa] dark:placeholder:text-[#52525b] dark:disabled:text-[#71717a]"
          />
        )}
      </div>
    </div>
  );
}

function HighlightedDiff({ diffResult, side }: { diffResult: DiffToken[]; side: 'removed' | 'added' }) {
  return (
    <div className="whitespace-pre-wrap">
      {diffResult.map((token, index) => {
        if (side === 'removed' && token.type === 'added') return null;
        if (side === 'added' && token.type === 'removed') return null;

        if (token.type === 'added') {
          return (
            <span key={index} className="mx-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {token.value}
            </span>
          );
        }

        if (token.type === 'removed') {
          return (
            <span key={index} className="mx-0.5 rounded-md bg-red-100 px-1.5 py-0.5 font-semibold text-red-700 line-through dark:bg-red-500/15 dark:text-red-300">
              {token.value}
            </span>
          );
        }

        return <span key={index}>{token.value}</span>;
      })}
    </div>
  );
}

function getDiffStats(diffResult: DiffToken[] | null) {
  const added = diffResult?.filter((token) => token.type === 'added').length ?? 0;
  const removed = diffResult?.filter((token) => token.type === 'removed').length ?? 0;
  const unchanged = diffResult?.filter((token) => token.type === 'unchanged').length ?? 0;
  const total = added + removed + unchanged;
  const percent = (value: number) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

  return {
    added,
    removed,
    unchanged,
    total,
    addedPct: percent(added),
    removedPct: percent(removed),
    unchangedPct: percent(unchanged),
    similarity: percent(unchanged),
  };
}
