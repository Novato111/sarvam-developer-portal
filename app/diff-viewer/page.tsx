// src/app/diff-viewer/page.tsx
'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import {
  Copy,
  Database,
  Info,
  Keyboard,
  Loader2,
  Zap,
} from 'lucide-react';
import { computeDiff, DiffToken } from '../utils/diffAlgorithm';
import { useToast } from '@/componets/ToastProvider';

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

const GlobalStyles = memo(function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        `,
      }}
    />
  );
});

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

const exampleChipGradients = [
  'radial-gradient(circle at 18% 12%, rgba(246,240,171,0.96) 0%, rgba(142,174,77,0.88) 34%, transparent 62%), radial-gradient(circle at 92% 85%, rgba(237,225,149,0.92) 0%, transparent 42%), linear-gradient(135deg,#5f8730 0%,#94b75a 55%,#d9d08c 100%)',
  'radial-gradient(circle at 18% 20%, rgba(221,228,255,0.98) 0%, rgba(129,145,237,0.9) 38%, transparent 64%), radial-gradient(circle at 88% 86%, rgba(255,210,134,0.84) 0%, transparent 46%), linear-gradient(135deg,#7889ec 0%,#aab7ff 56%,#f1bd67 100%)',
  'radial-gradient(circle at 20% 18%, rgba(255,218,161,0.96) 0%, rgba(224,116,83,0.9) 36%, transparent 62%), radial-gradient(circle at 88% 82%, rgba(174,88,124,0.84) 0%, transparent 46%), linear-gradient(135deg,#bd5548 0%,#e4755c 52%,#a8577a 100%)',
];

const fineChipGrain =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.16) 0 0.35px, transparent 0.6px), radial-gradient(circle at 72% 34%, rgba(0,0,0,0.14) 0 0.35px, transparent 0.6px), radial-gradient(circle at 42% 76%, rgba(255,255,255,0.12) 0 0.35px, transparent 0.6px), radial-gradient(circle at 84% 82%, rgba(0,0,0,0.10) 0 0.35px, transparent 0.6px)';

export default function DiffViewer() {
  const { toast } = useToast();
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [livePrompt, setLivePrompt] = useState(mockScenarios[2].prompt);
  const [modelAOutput, setModelAOutput] = useState(mockScenarios[2].modelA);
  const [modelBOutput, setModelBOutput] = useState(mockScenarios[2].modelB);
  const [diffResult, setDiffResult] = useState<DiffToken[] | null>(
    computeDiff(mockScenarios[2].modelA, mockScenarios[2].modelB)
  );

  const loadMockScenario = useCallback((index: number) => {
    const scenario = mockScenarios[index];
    setLivePrompt(scenario.prompt);
    setModelAOutput(scenario.modelA);
    setModelBOutput(scenario.modelB);
    setDiffResult(computeDiff(scenario.modelA, scenario.modelB));
  }, []);

  const handleModeSwitch = useCallback((live: boolean) => {
    setIsLiveMode(live);
    setDiffResult(null);

    if (live) {
      setModelAOutput('');
      setModelBOutput('');
      return;
    }

    loadMockScenario(2);
  }, [loadMockScenario]);

  const handleGenerateAndCompare = useCallback(async (promptOverride?: string) => {
    if (isLiveMode) {
      const promptToCompare = (promptOverride ?? livePrompt).trim();
      if (!promptToCompare) {
        toast({
          title: 'Prompt required',
          description: 'Enter a prompt to compare.',
          variant: 'warning',
        });
        return;
      }

      setLivePrompt(promptToCompare);
      setIsGenerating(true);
      setDiffResult(null);

      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptToCompare }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Compare request failed');
        }

        if (data.modelA && data.modelB) {
          setModelAOutput(data.modelA);
          setModelBOutput(data.modelB);
          setDiffResult(computeDiff(data.modelA, data.modelB));
          toast({
            title: 'Comparison ready',
            description: 'Model outputs updated.',
            variant: 'success',
          });
        } else {
          throw new Error('No comparison returned');
        }
      } catch (error) {
        console.error('Failed to fetch live comparison', error);
        toast({
          title: error instanceof Error && error.message.includes('timed out') ? 'Comparison timed out' : 'Comparison failed',
          description: error instanceof Error && error.message.includes('timed out') ? 'Sarvam is busy. Try again shortly.' : 'Try again in a moment.',
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setDiffResult(computeDiff(modelAOutput, modelBOutput));
  }, [isLiveMode, livePrompt, modelAOutput, modelBOutput, toast]);

  const diffStats = useMemo(() => getDiffStats(diffResult), [diffResult]);

  return (
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-hidden bg-white font-['Geist'] text-[#09090b] dark:bg-[#09090b] dark:text-[#fafafa] lg:h-screen">
      <GlobalStyles />
      <main className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#0f0f12]">
          <header className="flex min-h-[64px] shrink-0 flex-col items-start justify-center gap-3 border-b border-black/5 bg-[#fafafa] px-4 py-3 dark:border-white/10 dark:bg-[#09090b] sm:min-h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-col justify-center">
              <h1 className="font-['Geist'] text-[15px] font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">Model Output Diff View</h1>
              <p className="mt-0.5 hidden truncate font-medium text-[10px] text-[#71717a] sm:block">
                Compare two model versions on the same prompt with token-level changed words.
              </p>
            </div>
            <ModeToggle isLiveMode={isLiveMode} onModeSwitch={handleModeSwitch} />
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-4 sm:px-6 lg:px-8">
            <PromptCard
              key={`${isLiveMode ? 'live' : 'sample'}-${livePrompt}`}
              isLiveMode={isLiveMode}
              isGenerating={isGenerating}
              livePrompt={livePrompt}
              onPromptChange={setLivePrompt}
              onModeSwitch={handleModeSwitch}
              onScenarioSelect={loadMockScenario}
              onCompare={handleGenerateAndCompare}
            />

            <StatsCard stats={diffStats} />

            <div className="relative min-h-0 xl:flex-1">
              <div className="grid h-full min-h-0 gap-4 xl:grid-cols-2">
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
            </div>

            <div className="flex shrink-0 items-start gap-2 text-[11px] leading-5 text-[#71717a] sm:items-center">
              <Info className="h-3.5 w-3.5 shrink-0" />
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
    <div className="inline-flex w-full shrink-0 rounded-[10px] border border-black/5 bg-[#f4f4f5] p-0.5 shadow-sm dark:border-white/10 dark:bg-[#18181b] sm:w-fit">
      <button
        type="button"
        onClick={() => onModeSwitch(false)}
        style={mockActive ? { background: activeToggleGradients.mock } : undefined}
        className={`relative isolate inline-flex h-9 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-[8px] px-3 text-xs font-medium tracking-[-0.01em] transition sm:flex-none ${
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
        className={`relative isolate inline-flex h-9 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-[8px] px-3 text-xs font-medium tracking-[-0.01em] transition sm:flex-none ${
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
  onCompare: (prompt: string) => void;
}) {
  const [draftPrompt, setDraftPrompt] = useState(livePrompt);

  const activateLiveMode = () => {
    if (!isLiveMode && !isGenerating) onModeSwitch(true);
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextPrompt = event.target.value;
    if (!isLiveMode) {
      onPromptChange(nextPrompt);
      onModeSwitch(true);
    }
    setDraftPrompt(nextPrompt);
  };

  const handleCompare = () => {
    if (!draftPrompt.trim() || isGenerating) return;
    onPromptChange(draftPrompt);
    onCompare(draftPrompt);
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();

    if (!isLiveMode) {
      activateLiveMode();
      return;
    }

    handleCompare();
  };

  return (
    <div className="relative isolate shrink-0 overflow-hidden rounded-[20px] border border-black/10 bg-[#fafafa] p-3 shadow-[0_12px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#18181b] dark:shadow-[0_14px_42px_rgba(0,0,0,0.34)] sm:rounded-[24px] sm:p-4">
      <div className="pointer-events-none absolute inset-x-6 -bottom-12 h-24 rounded-full bg-[linear-gradient(90deg,rgba(37,99,235,0.18),rgba(168,85,247,0.22),rgba(249,115,22,0.18))] blur-3xl dark:bg-[linear-gradient(90deg,rgba(37,99,235,0.24),rgba(168,85,247,0.28),rgba(249,115,22,0.24))] sm:inset-x-8 sm:h-28" />
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
              value={draftPrompt}
              onFocus={activateLiveMode}
              onChange={handlePromptChange}
              onKeyDown={handlePromptKeyDown}
              disabled={isGenerating}
              className="mt-2 block min-h-[54px] w-full resize-none overflow-hidden bg-transparent text-[15px] leading-[1.65] tracking-[-0.01em] text-[#09090b] outline-none placeholder:text-[#a1a1aa] disabled:text-[#71717a] dark:text-[#fafafa] dark:placeholder:text-[#52525b] dark:disabled:text-[#71717a]"
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
                  onClick={handleCompare}
                  disabled={isGenerating || !draftPrompt.trim()}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#09090b] px-5 text-sm font-semibold tracking-[-0.01em] text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fafafa] dark:text-[#09090b] sm:w-auto"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate and compare'}
                </button>
              )}
            </div>
          </div>

          {!isLiveMode && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-[14px] border border-black/5 bg-white/70 p-2 shadow-sm dark:border-white/10 dark:bg-[#0f0f12] sm:gap-2 sm:p-2.5">
              <span className="px-1 text-[11px] font-semibold tracking-[-0.01em] text-[#09090b] dark:text-white sm:text-[12px]">Try an example</span>
              {mockScenarios.map((scenario, index) => (
                <button
                  key={scenario.label}
                  type="button"
                  onClick={() => onScenarioSelect(index)}
                  className="relative isolate overflow-hidden rounded-lg border border-white/35 px-2.5 py-1 text-[10px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#09090b]/20 dark:border-white/15 dark:shadow-[0_10px_22px_rgba(0,0,0,0.28)] dark:focus-visible:ring-white/25 sm:px-3 sm:py-1.5 sm:text-[11px]"
                  style={{ background: exampleChipGradients[index % exampleChipGradients.length] }}
                >
                  <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: fineChipGrain, backgroundSize: '4px 4px' }} />
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.12))]" />
                  <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">{scenario.label}</span>
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
    { label: 'Total Tokens', value: String(stats.total), sub: 'tokens compared', tone: 'neutral', bar: stats.total > 0 ? 100 : 0 },
    { label: 'Added', value: `+${stats.added}`, sub: `${stats.addedPct}% added`, tone: 'added', bar: stats.addedPct },
    { label: 'Removed', value: `-${stats.removed}`, sub: `${stats.removedPct}% removed`, tone: 'removed', bar: stats.removedPct },
    { label: 'Unchanged', value: String(stats.unchanged), sub: `${stats.unchangedPct}% unchanged`, tone: 'stable', bar: stats.unchangedPct },
  ];
  const dialDegrees = Math.max(0, Math.min(100, stats.similarity)) * 3.6;
  const dialMidpoint = dialDegrees > 0 ? Math.max(8, dialDegrees * 0.55) : 0;

  return (
    <section className="relative isolate shrink-0 overflow-hidden rounded-[16px] border border-black/5 bg-[#fafafa] p-2.5 shadow-sm dark:border-white/10 dark:bg-[#09090b] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(0,0,0,0.30)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay dark:opacity-20" style={{ backgroundImage: fineChipGrain, backgroundSize: '4px 4px' }} />

      <div className="relative z-10 grid gap-2.5 lg:grid-cols-[92px_minmax(0,1fr)]">
        <div className="grid place-items-center rounded-[13px] border border-black/5 bg-white/78 p-2 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-[#0c0d10]/82 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.34)]">
          <div
            className="relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_20px_rgba(15,23,42,0.10)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_22px_rgba(0,0,0,0.30)]"
            style={{
              background: `conic-gradient(from -90deg, #789b42 0deg, #8f9df4 ${dialMidpoint}deg, #e4765b ${dialDegrees}deg, rgba(113,113,122,0.16) ${dialDegrees}deg 360deg)`,
            }}
            aria-label={`${stats.similarity}% similarity`}
          >
            <div className="absolute inset-[4px] rounded-full bg-white dark:bg-[#09090b]" />
            <div className="absolute inset-[8px] rounded-full border border-black/5 bg-[#fafafa] dark:border-white/[0.08] dark:bg-[#111216]" />
            <div className="relative text-center">
              <div className="text-[12px] font-semibold leading-none tracking-normal text-[#09090b] dark:text-[#fafafa]">{stats.similarity}%</div>
              <div className="mt-1 text-[6.5px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">Match</div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <SummaryMetric key={metric.label} metric={metric} />
          ))}
          <AlgorithmMetric />
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({
  metric,
}: {
  metric: {
    label: string;
    value: string;
    sub: string;
    tone: string;
    bar: number;
  };
}) {
  const toneStyles: Record<string, { value: string; bar: string }> = {
    neutral: {
      value: 'text-[#09090b] dark:text-[#fafafa]',
      bar: 'linear-gradient(90deg,#789b42,#8f9df4,#e4765b)',
    },
    added: {
      value: 'text-emerald-600 dark:text-emerald-400',
      bar: 'linear-gradient(90deg,#15803d,#84a948,#d8d190)',
    },
    removed: {
      value: 'text-red-600 dark:text-red-400',
      bar: 'linear-gradient(90deg,#b91c1c,#e4765b,#a8577a)',
    },
    stable: {
      value: 'text-[#5161ff] dark:text-[#aab7ff]',
      bar: 'linear-gradient(90deg,#7889ec,#aab7ff,#d8e0ff)',
    },
  };
  const style = toneStyles[metric.tone] ?? toneStyles.neutral;
  const barWidth = `${Math.max(0, Math.min(100, metric.bar))}%`;

  return (
    <div className="relative isolate min-w-0 overflow-hidden rounded-[13px] border border-black/5 bg-white/82 p-2.5 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-[#0c0d10]/82 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.30)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70 dark:bg-white/10" />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">{metric.label}</div>
        </div>
        <div className={`mt-1.5 text-[21px] font-semibold leading-none tracking-[-0.02em] ${style.value}`}>{metric.value}</div>
        <div className="mt-1 whitespace-nowrap text-[10px] font-medium leading-4 tracking-[-0.01em] text-[#71717a]">{metric.sub}</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full rounded-full" style={{ width: barWidth, background: style.bar }} />
        </div>
      </div>
    </div>
  );
}

function AlgorithmMetric() {
  return (
    <div className="relative isolate min-w-0 overflow-hidden rounded-[13px] border border-black/5 bg-white/82 p-2.5 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-[#0c0d10]/82 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.30)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70 dark:bg-white/10" />
      <div className="relative z-10 flex h-full min-h-[72px] flex-col">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-[#71717a]" />
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">Diff Algorithm</div>
        </div>
        <div className="mt-1.5 text-[14px] font-semibold leading-none tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">Token-level LCS</div>
        <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-4 tracking-[-0.01em] text-[#71717a]">
          Custom dynamic programming diff. Preserves spacing and highlights changed tokens.
        </p>
        <div className="mt-auto pt-2">
          <div className="h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#789b42,#8f9df4,#e4765b)]" />
          </div>
        </div>
      </div>
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
  const { toast } = useToast();
  const isBlue = tone === 'blue';
  const [viewMode, setViewMode] = useState<'diff' | 'text'>('diff');
  const showDiff = diffResult && viewMode === 'diff';

  const handleCopy = async () => {
    if (!rawValue.trim()) {
      toast({
        title: 'Nothing to copy',
        description: 'Run a comparison first.',
        variant: 'warning',
      });
      return;
    }

    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(rawValue);
      toast({
        title: 'Copied',
        description: `${title} output copied.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Select the text and copy manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-[360px] min-h-0 flex-col overflow-hidden rounded-[12px] border border-black/5 bg-[#fafafa] shadow-sm dark:border-white/10 dark:bg-[#000000] md:h-[400px] xl:h-full">
      <div className="flex shrink-0 flex-col gap-3 border-b border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f0f12] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <GradientAvatar tone={tone} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold tracking-[-0.01em] text-[#09090b] dark:text-[#fafafa]">{title}</h2>
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
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
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
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 font-medium text-xs leading-6 text-[#09090b] dark:text-[#fafafa]">
        {showDiff ? (
          <HighlightedDiff diffResult={diffResult} side={side} />
        ) : diffResult ? (
          <div className="whitespace-pre-wrap break-words">{rawValue}</div>
        ) : (
          <textarea
            value={rawValue}
            onChange={(event) => onRawChange(event.target.value)}
            disabled={disabled}
            placeholder={disabled ? 'Run Compare to generate output.' : 'Paste or edit model output here.'}
            className="h-full min-h-[240px] w-full resize-none bg-transparent text-xs leading-6 text-[#09090b] outline-none placeholder:text-[#a1a1aa] disabled:text-[#71717a] dark:text-[#fafafa] dark:placeholder:text-[#52525b] dark:disabled:text-[#71717a] sm:min-h-[220px]"
          />
        )}
      </div>
    </div>
  );
}

function HighlightedDiff({ diffResult, side }: { diffResult: DiffToken[]; side: 'removed' | 'added' }) {
  return (
    <div className="whitespace-pre-wrap break-words">
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
