import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  GitCompare,
  Keyboard,
  Mic,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';

const chipGradients = [
  'radial-gradient(circle at 18% 12%, rgba(246,240,171,0.96) 0%, rgba(142,174,77,0.88) 34%, transparent 62%), radial-gradient(circle at 92% 85%, rgba(237,225,149,0.92) 0%, transparent 42%), linear-gradient(135deg,#5f8730 0%,#94b75a 55%,#d9d08c 100%)',
  'radial-gradient(circle at 18% 20%, rgba(221,228,255,0.98) 0%, rgba(129,145,237,0.9) 38%, transparent 64%), radial-gradient(circle at 88% 86%, rgba(255,210,134,0.84) 0%, transparent 46%), linear-gradient(135deg,#7889ec 0%,#aab7ff 56%,#f1bd67 100%)',
  'radial-gradient(circle at 20% 18%, rgba(255,218,161,0.96) 0%, rgba(224,116,83,0.9) 36%, transparent 62%), radial-gradient(circle at 88% 82%, rgba(174,88,124,0.84) 0%, transparent 46%), linear-gradient(135deg,#bd5548 0%,#e4755c 52%,#a8577a 100%)',
];

const fineGrain =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.16) 0 0.35px, transparent 0.6px), radial-gradient(circle at 72% 34%, rgba(0,0,0,0.14) 0 0.35px, transparent 0.6px), radial-gradient(circle at 42% 76%, rgba(255,255,255,0.12) 0 0.35px, transparent 0.6px), radial-gradient(circle at 84% 82%, rgba(0,0,0,0.10) 0 0.35px, transparent 0.6px)';

const quickLinks = [
  {
    title: 'Open Playground',
    href: '/playground',
    description: 'Test text and audio prompts with live streaming metrics.',
    icon: Terminal,
  },
  {
    title: 'Open Diff View',
    href: '/diff-viewer',
    description: 'Compare baseline and candidate model outputs token by token.',
    icon: GitCompare,
  },
];

const playgroundSteps = [
  'Choose the text model or voice model from the model selector.',
  'Type a prompt, click an example, or tap the mic to record audio.',
  'Send the prompt and watch the answer appear as tokens stream in.',
  'Use the stop button during streaming if you want to keep the partial answer.',
];

const diffSteps = [
  'Start with sample data to understand token-level highlighting.',
  'Switch to Use real model when you want fresh model outputs.',
  'Enter one prompt, then generate and compare the two model versions.',
  'Use Diff or Text on each response card to switch between marked changes and clean text.',
];

const notes = [
  {
    title: 'Live Metrics',
    body: 'Tokens, speed, and elapsed time update while the response is streaming, so you can judge responsiveness without waiting for the final answer.',
    icon: Activity,
  },
  {
    title: 'Audio Flow',
    body: 'Voice mode records a short browser audio clip, transcribes it, then places the transcript into the text flow for prompting.',
    icon: Mic,
  },
  {
    title: 'Error States',
    body: 'Network drops, stopped streams, short recordings, transcription issues, and compare timeouts show minimal toasts while preserving useful output.',
    icon: ShieldCheck,
  },
  {
    title: 'Keyboard Access',
    body: 'Enter sends a prompt, Shift + Enter adds a new line, buttons are focusable, and streamed answers announce updates politely.',
    icon: Keyboard,
  },
];

function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        `,
      }}
    />
  );
}

function GradientChip({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <span
      className="relative isolate inline-flex overflow-hidden rounded-full px-3 py-1 text-[11px] font-semibold tracking-normal text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
      style={{ background: chipGradients[index % chipGradients.length] }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: fineGrain, backgroundSize: '4px 4px' }} />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <div className="grid gap-2">
      {steps.map((step, index) => (
        <div key={step} className="flex gap-3 rounded-[12px] border border-black/5 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-[#0c0d10]">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#09090b] text-[10px] font-semibold text-white dark:bg-[#fafafa] dark:text-[#09090b]">
            {index + 1}
          </span>
          <p className="text-[13px] font-medium leading-5 text-[#52525b] dark:text-[#a1a1aa]">{step}</p>
        </div>
      ))}
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-hidden bg-white font-['Geist'] text-[#09090b] dark:bg-[#0f0f12] dark:text-[#fafafa] lg:h-screen">
      <GlobalStyles />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[64px] shrink-0 items-center border-b border-black/5 bg-[#fafafa] px-4 py-3 dark:border-white/10 dark:bg-[#09090b] sm:min-h-[68px] sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">
              Documentation
            </h1>
            <p className="mt-0.5 hidden truncate text-[10px] font-medium text-[#71717a] sm:block">
              Simple guide for using the inference playground and model diff view.
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5">
            <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[18px] border border-black/5 bg-[#fafafa] p-5 shadow-sm dark:border-white/10 dark:bg-[#09090b]">
                <div className="flex flex-wrap gap-2">
                  <GradientChip index={0}>Text input</GradientChip>
                  <GradientChip index={1}>Audio input</GradientChip>
                  <GradientChip index={2}>Token streaming</GradientChip>
                </div>
                <h2 className="mt-5 max-w-2xl text-[22px] font-semibold leading-tight tracking-normal text-[#09090b] dark:text-[#fafafa] sm:text-[26px]">
                  Use the portal to test prompts, inspect streams, and compare model updates.
                </h2>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#71717a]">
                  This developer portal is built for the assignment workflow: run browser-based inference, watch live metrics, and review token-level output differences before a model rollout.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {quickLinks.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group relative isolate overflow-hidden rounded-[18px] border border-black/5 bg-[#fafafa] p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-[#18181b] dark:hover:bg-[#202024]"
                    >
                      <span className="pointer-events-none absolute right-3 top-3 h-10 w-10 rounded-full opacity-85" style={{ background: chipGradients[index] }} />
                      <span className="pointer-events-none absolute right-3 top-3 h-10 w-10 rounded-full opacity-30 mix-blend-overlay" style={{ backgroundImage: fineGrain, backgroundSize: '4px 4px' }} />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div>
                          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-white text-[#09090b] shadow-sm dark:bg-[#0f0f12] dark:text-[#fafafa]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <h3 className="mt-4 text-sm font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">{item.title}</h3>
                          <p className="mt-1 text-[12px] font-medium leading-5 text-[#71717a]">{item.description}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#71717a] transition group-hover:translate-x-0.5 group-hover:text-[#09090b] dark:group-hover:text-[#fafafa]" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[18px] border border-black/5 bg-[#fafafa] p-4 shadow-sm dark:border-white/10 dark:bg-[#09090b]">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#71717a]" />
                  <h2 className="text-sm font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">Inference Playground</h2>
                </div>
                <p className="mt-2 text-[12px] font-medium leading-5 text-[#71717a]">
                  Use this when you want to test the model response experience from the browser.
                </p>
                <div className="mt-4">
                  <StepList steps={playgroundSteps} />
                </div>
              </div>

              <div className="rounded-[18px] border border-black/5 bg-[#fafafa] p-4 shadow-sm dark:border-white/10 dark:bg-[#09090b]">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-[#71717a]" />
                  <h2 className="text-sm font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">Model Output Diff View</h2>
                </div>
                <p className="mt-2 text-[12px] font-medium leading-5 text-[#71717a]">
                  Use this when you want to compare how two model versions answer the same prompt.
                </p>
                <div className="mt-4">
                  <StepList steps={diffSteps} />
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {notes.map((note, index) => {
                const Icon = note.icon;
                return (
                  <div key={note.title} className="rounded-[16px] border border-black/5 bg-[#fafafa] p-4 shadow-sm dark:border-white/10 dark:bg-[#09090b]">
                    <div className="flex items-center gap-2">
                      <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-white" style={{ background: chipGradients[index % chipGradients.length] }}>
                        <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: fineGrain, backgroundSize: '4px 4px' }} />
                        <Icon className="relative z-10 h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-[13px] font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">{note.title}</h3>
                    </div>
                    <p className="mt-3 text-[12px] font-medium leading-5 text-[#71717a]">{note.body}</p>
                  </div>
                );
              })}
            </section>

            <section className="rounded-[18px] border border-black/5 bg-[#fafafa] p-4 shadow-sm dark:border-white/10 dark:bg-[#09090b]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-white" style={{ background: chipGradients[1] }}>
                    <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: fineGrain, backgroundSize: '4px 4px' }} />
                    <BookOpen className="relative z-10 h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">Recommended demo path</h2>
                    <p className="mt-1 text-[12px] font-medium text-[#71717a]">Playground first, then Diff View, then explain the algorithm card.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GradientChip index={0}>1. Stream</GradientChip>
                  <GradientChip index={1}>2. Compare</GradientChip>
                  <GradientChip index={2}>3. Review</GradientChip>
                </div>
              </div>
              <div className="mt-4 rounded-[14px] border border-black/5 bg-white/80 p-3 dark:border-white/10 dark:bg-[#0c0d10]">
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#71717a]" />
                  <p className="text-[12px] font-medium leading-5 text-[#71717a]">
                    For the walkthrough, start with an example prompt, show tokens and speed updating, stop one stream to show preserved output, then open the diff view and compare two model outputs at token level.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
