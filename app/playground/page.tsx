// src/app/playground/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Type, Play, Square, AlertCircle } from 'lucide-react';
import { useStream } from '../hooks/useStream';
import { useAudioRecord } from '../hooks/useAudioRecord';


export default function Playground() {
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [promptText, setPromptText] = useState('');
  
  // Extract all our powerful hook logic
  const { output, setOutput, isStreaming, error, metrics, startStream, stopStream } = useStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- SESSION PERSISTENCE (HYDRATION) ---
  // Load saved session on component mount
// --- SESSION PERSISTENCE (HYDRATION) ---
  // Load saved session on component mount
  useEffect(() => {
    // Push the state update to the end of the event loop.
    // This satisfies the React linter by acting as an asynchronous callback,
    // while safely avoiding Next.js SSR hydration crashes!
    const hydrationTimer = setTimeout(() => {
      const savedPrompt = localStorage.getItem('sarvam_prompt');
      const savedOutput = localStorage.getItem('sarvam_output');
      
      if (savedPrompt) setPromptText(savedPrompt);
      if (savedOutput && setOutput) setOutput(savedOutput);
    }, 0);

    // Cleanup the timer if the component unmounts quickly
    return () => clearTimeout(hydrationTimer);
  }, [setOutput]);
  // Save Prompt to localStorage on change (Debounced to avoid lag)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('sarvam_prompt', promptText);
    }, 500); 
    return () => clearTimeout(timeoutId);
  }, [promptText]);

  // Save Output to localStorage (Only save when stream finishes/stops to prevent lag)
  useEffect(() => {
    if (!isStreaming && output) {
      localStorage.setItem('sarvam_output', output);
    }
  }, [isStreaming, output]);
  // ---------------------------------------------

  // Auto-scroll effect for the streaming text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  // Live TPS Calculation
  const calculateTPS = () => {
    if (metrics.tokenCount === 0 || metrics.startTime === 0) return '0.00';
    const secondsElapsed = (performance.now() - metrics.startTime) / 1000;
    return (metrics.tokenCount / secondsElapsed).toFixed(2);
  };

  // Submit Handler
  const handleSubmit = () => {
    if (!promptText.trim() || isStreaming) return;
    startStream(promptText);
  };

  // Audio Hook integration
  const { startRecording, stopRecording, isRecording, isTranscribing, audioError } = useAudioRecord((transcript) => {
    setPromptText(transcript);
    setInputMode('text'); // Auto-switch back so they can review the text
  });

  return (
    <div className="p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER & METRICS */}
        <header className="flex justify-between items-end border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inference Playground</h1>
            <p className="text-gray-500 mt-1">Test model outputs in real-time.</p>
          </div>
          
          <div className="flex gap-6 text-sm font-mono bg-white p-3 rounded-lg border shadow-sm" aria-live="polite">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Tokens</span>
              <span className="font-semibold text-blue-600 text-lg">{metrics.tokenCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Speed</span>
              <span className="font-semibold text-green-600 text-lg">{calculateTPS()} t/s</span>
            </div>
          </div>
        </header>

        {/* OUTPUT AREA */}
        <div className="flex flex-col gap-4">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start gap-3" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Stream Notification</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <div 
            className="w-full h-80 p-6 bg-white border rounded-xl shadow-inner overflow-y-auto font-mono text-sm leading-relaxed relative"
            aria-live="polite" 
            aria-atomic="false"
          >
            {output ? (
              <span className="whitespace-pre-wrap">{output}</span>
            ) : (
              <span className="text-gray-400 italic">Waiting for input...</span>
            )}
            {/* Blinking Cursor */}
            {isStreaming && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />}
            
            {/* Invisible anchor for auto-scroll */}
            <div ref={scrollRef} className="h-4" /> 
          </div>
        </div>

        {/* INPUT CONTROLS */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          {/* Multi-Modal Toggle */}
          <div className="flex gap-2 mb-4 border-b pb-4">
            <button
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'text' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={inputMode === 'text'}
              aria-label="Switch to Text Input Mode"
            >
              <Type className="w-4 h-4" /> Text
            </button>
            <button
              onClick={() => setInputMode('audio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'audio' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={inputMode === 'audio'}
              aria-label="Switch to Audio Input Mode"
            >
              <Mic className="w-4 h-4" /> Audio
            </button>
          </div>

          {/* Dynamic Input Area Based on Toggle */}
          <div className="flex gap-4 items-end">
            {inputMode === 'text' ? (
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your prompt here..."
                className="flex-1 min-h-[80px] p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                disabled={isStreaming}
                aria-label="Text Prompt Input"
              />
            ) : (
              <div className="flex-1 min-h-[80px] flex items-center justify-center border border-dashed rounded-lg bg-gray-50 p-4">
                 {audioError ? (
                    <span className="text-red-500 text-sm">{audioError}</span>
                 ) : isTranscribing ? (
                    <span className="text-blue-600 flex items-center gap-2 text-sm font-medium animate-pulse">
                       Transcribing audio to text...
                    </span>
                 ) : isRecording ? (
                    <button 
                      onClick={stopRecording}
                      className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full font-medium hover:bg-red-200 transition-colors"
                    >
                      <Square className="w-4 h-4 fill-current" /> Stop Recording
                      <span className="relative flex h-3 w-3 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </button>
                 ) : (
                    <button 
                      onClick={startRecording}
                      className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
                    >
                      <Mic className="w-4 h-4" /> Start Recording
                    </button>
                 )}
              </div>
            )}

            {/* Dynamic Action Button (Run / Stop) */}
            {isStreaming ? (
              <button
                onClick={stopStream}
                className="px-6 py-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center gap-2 transition-colors h-[80px]"
                aria-label="Stop Inference"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!promptText.trim()}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[80px]"
                aria-label="Run Inference"
              >
                <Play className="w-5 h-5 fill-current" />
                Run
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}