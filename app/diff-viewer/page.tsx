// src/app/diff-viewer/page.tsx
'use client';

import { useState } from 'react';

import { SplitSquareHorizontal, ArrowLeft, Database, Zap, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { computeDiff, DiffToken } from '../utils/diffAlgorithm';


// Pre-defined edge cases to show off the algorithm
  const mockScenarios = [
    {
      label: "Minor Tweaks",
      modelA: "The Sarvam models are fast and highly accurate on Indian languages.",
      modelB: "Sarvam AI models are extremely fast and accurate on Indic languages."
    },
    {
      label: "Heavy Deletion",
      modelA: "The quick brown fox jumps over the lazy dog and runs into the dark forest.",
      modelB: "The fox jumps over the dog."
    },
    {
      label: "Total Rewrite",
      modelA: "Company X is building a developer portal for enterprise engineers.",
      modelB: "A new internal hub is being developed to assist software engineering teams."
    }
  ];


export default function DiffViewer() {
  // Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [livePrompt, setLivePrompt] = useState('');

  const loadMockScenario = (index: number) => {
    setModelAOutput(mockScenarios[index].modelA);
    setModelBOutput(mockScenarios[index].modelB);
    setDiffResult(null); // Clear the diff so they have to click "Run Comparison" again, making the action feel tactile
  };

  // Text States
  const [modelAOutput, setModelAOutput] = useState("The Sarvam models are fast and highly accurate on Indian languages.");
  const [modelBOutput, setModelBOutput] = useState("Sarvam AI models are extremely fast and accurate on Indic languages.");
  const [diffResult, setDiffResult] = useState<DiffToken[] | null>(null);

  const handleModeSwitch = (live: boolean) => {
    setIsLiveMode(live);
    setDiffResult(null); // Clear previous results
    if (!live) {
      // Reset to perfect mock data
      setModelAOutput("The Sarvam models are fast and highly accurate on Indian languages.");
      setModelBOutput("Sarvam AI models are extremely fast and accurate on Indic languages.");
    } else {
      // Clear for live generation
      setModelAOutput("");
      setModelBOutput("");
    }
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
        console.error("Failed to fetch live comparison", error);
      } finally {
        setIsGenerating(false);
      }
    } else {
      setDiffResult(computeDiff(modelAOutput, modelBOutput));
    }
  };
  // Calculate Diff Statistics
  const diffStats = diffResult ? {
    added: diffResult.filter(t => t.type === 'added').length,
    removed: diffResult.filter(t => t.type === 'removed').length,
    unchanged: diffResult.filter(t => t.type === 'unchanged').length,
    total: diffResult.length
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Mode Toggle & Description */}
        <header className="flex items-start justify-between pb-6 border-b border-gray-200">
          <div>
            
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <SplitSquareHorizontal className="w-8 h-8 text-purple-600" />
              Model Output Diff
            </h1>
            <p className="text-gray-500 mt-1">Compare outputs from two model versions at the token level.</p>
          </div>

          {/* Toggle and Context Area */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg border">
              <button
                onClick={() => handleModeSwitch(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !isLiveMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database className="w-4 h-4" /> Mock Data
              </button>
              <button
                onClick={() => handleModeSwitch(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isLiveMode ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Zap className="w-4 h-4" /> Live API
              </button>
            </div>
            
            {/* Dynamic Description explaining what the toggle does */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 max-w-xs text-right">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {isLiveMode 
                  ? "Fetches real outputs from Sarvam's API via parallel requests using different temperatures." 
                  : "Uses static, deterministic text to cleanly demonstrate the underlying Dynamic Programming LCS algorithm."}
              </span>
            </div>
          </div>
        </header>

        {/* Live Prompt Input Area */}
        {isLiveMode && (
          <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-4 items-center">
             <input 
                type="text"
                value={livePrompt}
                onChange={(e) => setLivePrompt(e.target.value)}
                placeholder="Enter a prompt to generate two distinct model outputs..."
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                disabled={isGenerating}
             />
          </div>
        )}

        {/* Input Text Areas with Dynamic Model Badges */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">Model Version A</h2>
              {/* Dynamic Badge */}
              <span className="text-[10px] font-mono uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                {isLiveMode ? 'sarvam-30b • temp: 0.1' : 'Mock Base Output'}
              </span>
            </div>
            <textarea
              value={modelAOutput}
              onChange={(e) => setModelAOutput(e.target.value)}
              className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-sm leading-relaxed"
              disabled={isGenerating || isLiveMode}
            />
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">Model Version B</h2>
               {/* Dynamic Badge */}
              <span className="text-[10px] font-mono uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                {isLiveMode ? 'sarvam-30b • temp: 0.8' : 'Mock Instruct Output'}
              </span>
            </div>
            <textarea
              value={modelBOutput}
              onChange={(e) => setModelBOutput(e.target.value)}
              className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-sm leading-relaxed"
              disabled={isGenerating || isLiveMode}
            />
          </div>
        </div>
{/* Sample Prompt Chips (Only in Mock Mode) */}
        {!isLiveMode && (
          <div className="flex flex-wrap gap-2 items-center text-sm mb-4 animate-in fade-in">
            <span className="text-gray-500 font-medium mr-2">Try an edge case:</span>
            {mockScenarios.map((scenario, idx) => (
              <button
                key={idx}
                onClick={() => loadMockScenario(idx)}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-full transition-colors"
              >
                {scenario.label}
              </button>
            ))}
          </div>
        )}
        {/* Action Button */}
        <div className="flex justify-center">
            <button
              onClick={handleGenerateAndCompare}
              disabled={isGenerating || (isLiveMode && !livePrompt)}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating & Diffing...</> : 'Run Comparison'}
            </button>
        </div>

        {/* Output Diff Result & Analytics */}
        {diffResult && diffStats && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4">
             
             {/* Main Header */}
             <div className="bg-gray-100 border-b px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Token-Level Analysis</h3>
             </div>

             {/* The New Analytics Report Bar */}
             <div className="bg-gray-50 border-b px-6 py-3 flex gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Total Tokens</span>
                  <span className="font-mono text-gray-900 font-medium">{diffStats.total}</span>
                </div>
                <div className="w-px bg-gray-200"></div> {/* Divider */}
                <div className="flex flex-col">
                  <span className="text-green-600 text-xs uppercase tracking-wider font-semibold">Tokens Added</span>
                  <span className="font-mono text-green-700 font-medium">+{diffStats.added}</span>
                </div>
                <div className="w-px bg-gray-200"></div> {/* Divider */}
                <div className="flex flex-col">
                  <span className="text-red-600 text-xs uppercase tracking-wider font-semibold">Tokens Removed</span>
                  <span className="font-mono text-red-700 font-medium">-{diffStats.removed}</span>
                </div>
                <div className="w-px bg-gray-200"></div> {/* Divider */}
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Similarity</span>
                  <span className="font-mono text-gray-900 font-medium">
                    {Math.round((diffStats.unchanged / diffStats.total) * 100)}%
                  </span>
                </div>
             </div>
             
             {/* The Highlighted Text Area */}
             <div className="p-8 text-lg leading-loose font-serif whitespace-pre-wrap">
               {diffResult.map((token, idx) => {
                 if (token.type === 'added') {
                   return <span key={idx} className="bg-green-100 text-green-900 px-1 rounded mx-px font-medium">{token.value}</span>;
                 }
                 if (token.type === 'removed') {
                   return <span key={idx} className="bg-red-100 text-red-900 px-1 rounded mx-px line-through opacity-70">{token.value}</span>;
                 }
                 return <span key={idx} className="text-gray-800">{token.value}</span>;
               })}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}