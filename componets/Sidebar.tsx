// src/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  ChevronLeft, 
  ChevronDown, 
  Terminal, 
  GitCompare, 
  Sparkles, 
  Headphones, 
  Moon, 
  Sun 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for next-themes
  useEffect(() => setMounted(true), []);

  const navItems = [
    { name: 'Playground', href: '/playground', icon: Terminal },
    { name: 'Model Diff', href: '/diff-viewer', icon: GitCompare },
  ];

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[280px] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#09090b] lg:flex select-none">
        
        <div className="flex flex-col px-4 pt-6 pb-4">
          {/* Header & Collapse */}
          <div className="flex items-center justify-between mb-6 px-1">
            <Link href="/playground" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              sarvam
            </Link>
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-[#09090b] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Workspace Card */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <button className="flex w-full items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-bold text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                  SA
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-zinc-900 leading-tight dark:text-zinc-100">
                    Sarvam AI
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Developer Workspace
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 mr-1" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-2">
          <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Inference Tools
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col px-4 pb-6">
          
     
          {/* Support & Dark Mode Card */}
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100">
              <Headphones className="h-4 w-4 shrink-0" />
              Support
            </button>
            
            <div className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 shrink-0" />
                Dark Mode
              </div>
              
              {/* Shadcn Switch */}
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-950 ${theme === 'dark' ? 'bg-zinc-50' : 'bg-zinc-900'}`}
                >
                  <span className={`pointer-events-none block h-4 w-4 rounded-full shadow-sm ring-0 transition-transform ${theme === 'dark' ? 'translate-x-4 bg-zinc-900' : 'translate-x-0 bg-white'}`} />
                </button>
              )}
            </div>
          </div>

          {/* User Profile Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-zinc-800 dark:bg-[#09090b]">
            <button className="flex w-full items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  SU
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[13px] font-semibold text-zinc-900 truncate w-full text-left leading-tight dark:text-zinc-100">
                    Sunny Sarjay
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 truncate w-full text-left dark:text-zinc-400">
                    sunny@example.com
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 mr-1 shrink-0" />
            </button>
          </div>

        </div>
      </aside>

      {/* ─── MOBILE HEADER ─── */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-[#09090b]/80 lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/playground" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            sarvam
          </Link>
          <div className="flex gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                    isActive ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50' : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                  aria-label={item.name}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              );
            })}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}