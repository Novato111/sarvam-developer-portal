# Sarvam Developer Portal

A polished frontend assignment project for testing browser-based inference, inspecting streamed model responses, and comparing model outputs with a custom token-level diff view.

Built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and Sarvam AI APIs.

## Overview

This portal is designed for the workflow described in the Frontend Intern Assignment:

- Test text and audio inference in a browser playground.
- Stream model responses token by token.
- Track live response metrics while the stream is active.
- Compare two model outputs side by side.
- Highlight token-level differences without using an external diff library.
- Provide clear error states, keyboard-friendly controls, and accessible streamed output.

## Live Links

- GitHub repository: `https://github.com/Novato111/sarvam-developer-portal`
- Deployed app: add Vercel or Netlify link here
- Video walkthrough: add walkthrough link here

## Main Routes

| Route | Purpose |
|---|---|
| `/playground` | Inference playground for text input, audio input, streaming responses, and live metrics |
| `/diff-viewer` | Side-by-side comparison view for baseline and candidate model outputs |
| `/documentation` | Short in-app guide for using the portal |

## Features

### Inference Playground

- Text prompt input with Enter to send and Shift + Enter for a new line.
- Audio input using the browser microphone.
- Model selector for text and voice modes.
- Sarvam chat streaming through `fetch` and `ReadableStream`.
- Live token counter, tokens-per-second, and elapsed time.
- Stop streaming support with partial output preserved.
- Markdown rendering for model responses.
- Minimal toast system for errors and status updates.

### Model Output Diff View

- Compare a baseline model response with a candidate model response.
- Sample mode for reliable local test cases.
- Live mode for comparing real model outputs from the API.
- Token-level highlighting for added and removed tokens.
- Clean text toggle for viewing each response without highlights.
- Compact metrics summary for match rate, added tokens, removed tokens, unchanged tokens, and algorithm info.

### Documentation

- Simple usage guide inside the app.
- Quick links to the playground and diff viewer.
- Step-by-step instructions for the main workflows.
- Notes on metrics, audio, errors, and keyboard access.

## Tech Stack

- Next.js `16`
- React `19`
- TypeScript
- Tailwind CSS `4`
- next-themes
- lucide-react
- Sarvam AI chat and speech-to-text APIs

## Getting Started

### Prerequisites

- Node.js `20.9` or newer
- npm
- Sarvam API key

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create `.env.local` in the project root:

```bash
SARVAM_API_KEY=your_sarvam_api_key_here
```

### 3. Run the development server

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3004
```

The app redirects to the playground flow.

## Available Scripts

```bash
npm run dev
```

Starts the local Next.js development server.

```bash
npm run lint
```

Runs ESLint.

```bash
npx tsc --noEmit
```

Runs TypeScript validation.

```bash
npm run build
```

Creates a production build.

## Project Structure

```text
app/
  api/
    chat/route.ts          Streaming chat proxy for Sarvam chat completions
    compare/route.ts       Parallel comparison calls with timeout handling
    transcribe/route.ts    Audio transcription proxy
  diff-viewer/page.tsx     Model output diff view
  documentation/page.tsx   In-app usage guide
  hooks/
    useAudioRecord.ts      Browser recording and transcription flow
    useStream.ts           Fetch + ReadableStream response handling
  playground/page.tsx      Inference playground
  utils/diffAlgorithm.ts   Custom token-level diff algorithm

components/
  Sidebar.tsx              App navigation and theme controls
  ThemeProvider.tsx        Dark mode provider
  ToastProvider.tsx        Minimal toast system
```

## Architecture Decisions

The app keeps API keys on the server by routing browser requests through Next.js API routes. The frontend never calls Sarvam directly with the secret key.

Streaming is handled in the client through `fetch`, `ReadableStream`, and a `TextDecoder`. Tokens are rendered as chunks arrive, so the UI does not wait for the full response before updating.

The compare route runs both model calls in parallel. This keeps the diff view faster than waiting for one model response before requesting the second. A timeout is used so the UI does not hang if the API is slow.

The UI is split into focused routes: playground for inference, diff viewer for comparison, and documentation for usage guidance. Shared shell behavior such as the sidebar, theme provider, and toast system lives in reusable components.

## Diff Algorithm

The diff view uses a custom token-level Longest Common Subsequence approach.

1. Split both model outputs into tokens.
2. Preserve whitespace tokens so the reconstructed output keeps readable spacing.
3. Build a dynamic programming table for the longest common token sequence.
4. Backtrack through the table to mark tokens as:
   - `unchanged`
   - `added`
   - `removed`
5. Render added and removed tokens with inline highlights.

### Complexity

If `n` is the number of tokens in the first response and `m` is the number of tokens in the second response:

- Time complexity: `O(n * m)`
- Space complexity: `O(n * m)`

This is acceptable for short and medium model outputs, which matches the assignment workflow. For very large documents, a more memory-efficient algorithm would be needed.

### Why This Approach

LCS is simple, deterministic, and easy to explain. It works well when the goal is to clearly show which words stayed the same, which words were removed, and which words were added.

Myers diff is more efficient for large text diffs, but it is more complex to implement and explain. Since the assignment focuses on model response comparison rather than large document diffing, the custom token-level LCS approach is a good fit.

## Error Handling

The app handles common failure cases with visible, minimal UI feedback:

- Empty prompts are blocked.
- Stream interruptions preserve partial output.
- Manual stream stops show a toast instead of resetting the session.
- Very short recordings are handled gracefully.
- Transcription failures show a clear message.
- Compare requests use timeout handling.
- Copy failures show fallback guidance.

## Accessibility

Accessibility considerations included:

- Keyboard-friendly inputs and buttons.
- `aria-live="polite"` for streamed chat updates.
- Screen-reader text for thinking and streaming states.
- Clear labels for icon-only controls.
- Toasts using status and alert roles.
- Color choices checked against light and dark UI readability.

## Known Limitations

- The diff algorithm compares exact tokens, not semantic meaning.
- The LCS implementation is not optimized for very large documents.
- Token counting in the streaming playground is an estimate based on whitespace splitting.
- Live comparison depends on external API latency and availability.
- The custom model selector can be further improved with full arrow-key menu navigation.

## Submission Notes

Before final submission, add these links to the README and PDF:

- Public GitHub repository link.
- Deployed Vercel or Netlify link.
- Three-minute video walkthrough link.

Also include the PDF sections requested in the assignment:

- Architecture decisions.
- Diffing algorithm approach.
- Time complexity analysis.
- Accessibility considerations.
- Error handling strategy.
- Part B Q1 bug report.
