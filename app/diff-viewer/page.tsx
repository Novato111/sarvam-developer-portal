// src/app/diff-viewer/page.tsx
'use client';

import { useState } from 'react';
import {
  Braces,
  Copy,
  Database,
  Info,
  Keyboard,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { computeDiff, DiffToken } from '../utils/diffAlgorithm';

const mockScenarios = [
  {
    label: 'Minor Tweaks',
    prompt: 'Compare concise descriptions of Sarvam models.',
    modelA: 'The Sarvam models are fast and highly accurate on Indian languages.',
    modelB: 'Sarvam AI models are extremely fast and accurate on Indic languages.',
  },
  {
    label: 'Heavy Deletion',
    prompt: 'Compare a verbose sentence against a shorter rewrite.',
    modelA: 'The quick brown fox jumps over the lazy dog and runs into the dark forest.',
    modelB: 'The fox jumps over the dog.',
  },
  {
    label: 'Education AI',
    prompt: 'Explain the benefits of using AI in education.',
    modelA:
      'AI in education can personalize learning experiences for students. It helps teachers automate repetitive tasks and provides intelligent insights to improve teaching strategies. Students get instant feedback which helps them learn faster. It also reduces administrative workloads and makes education more efficient.',
    modelB:
      'AI in education can personalize learning experiences for students. It helps teachers streamline operations and delivers intelligent insights that enhance teaching strategies. Students receive instant feedback which accelerates their learning. It also minimizes administrative workloads and makes education more effective and impactful.',
  },
];

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
    <div className="h-screen overflow-hidden bg-white p-3 dark:bg-[#07080a] sm:p-4">
      <section className="relative h-[calc(100vh-1.5rem)] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_64px_rgba(15,23,42,0.09)] ring-1 ring-slate-900/[0.03] dark:border-white/10 dark:bg-[#101216] dark:shadow-[0_18px_64px_rgba(0,0,0,0.55)] dark:ring-white/5 sm:h-[calc(100vh-2rem)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(105deg,rgba(255,166,73,0.28),rgba(255,119,138,0.13),rgba(112,112,255,0.18))] dark:bg-[linear-gradient(105deg,rgba(73,68,255,0.36),rgba(178,74,190,0.20),rgba(255,96,12,0.32))]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] dark:bg-[radial-gradient(circle_at_70%_10%,rgba(124,116,255,0.14),transparent_30%),linear-gradient(180deg,rgba(16,18,22,0.98),rgba(10,12,16,0.92))]" />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-7">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Model Diff</h1>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Compare responses from two model versions and see exactly what changed.
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#8578ff] via-[#c46bff] to-[#ff8a4b] text-xs font-bold text-white shadow-lg shadow-violet-200">
              SU
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 pt-4 sm:px-7">
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
                title="sarvam-30b"
                badge="Model A"
                tone="blue"
                modeLabel={isLiveMode ? 'temperature 0.1' : 'base output'}
                rawValue={modelAOutput}
                onRawChange={setModelAOutput}
                diffResult={diffResult}
                disabled={isLiveMode || isGenerating}
                side="removed"
              />
              <ModelCard
                title="sarvam-105b"
                badge="Model B"
                tone="orange"
                modeLabel={isLiveMode ? 'temperature 0.2' : 'variant output'}
                rawValue={modelBOutput}
                onRawChange={setModelBOutput}
                diffResult={diffResult}
                disabled={isLiveMode || isGenerating}
                side="added"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Info className="h-3.5 w-3.5" />
              <span>
                {isLiveMode
                  ? 'Live mode uses temperature 0.1 for Model A and 0.2 for Model B to surface meaningful variations.'
                  : 'Mock mode uses local examples, so you can test the diff UI without calling the API.'}
              </span>
            </div>
          </main>
        </div>
      </section>
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
  return (
    <div className="shrink-0 rounded-2xl border border-slate-200 bg-white/88 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_12px_34px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="diff-prompt" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Enter your prompt
          </label>
          <textarea
            id="diff-prompt"
            value={livePrompt}
            onChange={(event) => onPromptChange(event.target.value)}
            disabled={!isLiveMode || isGenerating}
            className="mt-2 h-16 w-full resize-none bg-transparent text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 disabled:text-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:disabled:text-slate-100"
            placeholder="Explain the benefits of using AI in education."
          />

          {!isLiveMode && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Examples</span>
              {mockScenarios.map((scenario, index) => (
                <button
                  key={scenario.label}
                  type="button"
                  onClick={() => onScenarioSelect(index)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#6f72ff]/40 hover:text-[#5161ff] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:text-[#9294ff]"
                >
                  {scenario.label}
                  <span className="sr-only"> example {index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/[0.045]">
            <button
              type="button"
              onClick={() => onModeSwitch(false)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                !isLiveMode
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              Mock
            </button>
            <button
              type="button"
              onClick={() => onModeSwitch(true)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                isLiveMode
                  ? 'bg-white text-[#5161ff] shadow-sm dark:bg-white/10 dark:text-[#9294ff]'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Live API
            </button>
          </div>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
            aria-label="Prompt tools"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onCompare}
            disabled={isGenerating || (isLiveMode && !livePrompt.trim())}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[linear-gradient(100deg,#6f72ff,#ff765d)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(111,114,255,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Braces className="h-4 w-4" />}
            Compare
          </button>
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
    <div className="grid shrink-0 gap-3 rounded-2xl border border-slate-200 bg-white/82 p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_12px_34px_rgba(0,0,0,0.25)] sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`px-3 ${index > 0 ? 'border-slate-200 dark:border-white/10 xl:border-l' : ''}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {metric.label}
            {metric.label === 'Similarity' && <Info className="h-3 w-3" />}
          </div>
          <div className={`mt-1 font-mono text-xl font-semibold tracking-tight ${metric.color}`}>{metric.value}</div>
          {metric.sub && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/86 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1117]/86 dark:shadow-[0_12px_34px_rgba(0,0,0,0.3)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/72 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-8 w-8 place-items-center rounded-full ${
              isBlue ? 'bg-indigo-50 text-[#5161ff] dark:bg-[#5161ff]/20 dark:text-[#9294ff]' : 'bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isBlue ? 'bg-indigo-50 text-[#5161ff] dark:bg-[#5161ff]/20 dark:text-[#9294ff]' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300'
                }`}
              >
                {badge}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{modeLabel}</p>
          </div>
        </div>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label={`Copy ${title} output`}
          onClick={() => navigator.clipboard?.writeText(rawValue)}
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-xs leading-6 text-slate-800 dark:text-slate-100">
        {diffResult ? (
          <HighlightedDiff diffResult={diffResult} side={side} />
        ) : (
          <textarea
            value={rawValue}
            onChange={(event) => onRawChange(event.target.value)}
            disabled={disabled}
            placeholder={disabled ? 'Run Compare to generate output.' : 'Paste or edit model output here.'}
            className="h-full min-h-[220px] w-full resize-none bg-transparent text-xs leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:text-slate-500"
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
