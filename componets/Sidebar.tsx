// src/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LayoutDashboard, Moon, SplitSquareHorizontal, Sun, TerminalSquare } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navItems = [
    { name: 'Playground', href: '/playground', icon: TerminalSquare },
    { name: 'Model Diff', href: '/diff-viewer', icon: SplitSquareHorizontal },
  ];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const themeTimer = window.setTimeout(() => {
      setIsDarkMode(localStorage.getItem('sarvam_theme') === 'dark');
    }, 0);

    return () => window.clearTimeout(themeTimer);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    document.documentElement.classList.toggle('dark', nextMode);
    localStorage.setItem('sarvam_theme', nextMode ? 'dark' : 'light');
  };

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[288px] p-4 lg:block">
        <div className="flex h-full flex-col rounded-[22px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-900/[0.03] backdrop-blur-xl dark:border-white/10 dark:bg-[#101216]/90 dark:shadow-[0_22px_70px_rgba(0,0,0,0.45)] dark:ring-white/5">
          <div className="flex h-12 items-center justify-between px-2">
            <Link href="/playground" className="text-[28px] font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#6667ff] via-[#9f6cff] to-[#ff805c] bg-clip-text text-transparent">
                sarvam
              </span>
            </Link>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
          </div>

          <div className="my-4 h-px bg-slate-200/80 dark:bg-white/10" />

          <div className="flex items-center gap-3 rounded-2xl px-2 py-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#8578ff] via-[#c46bff] to-[#ff8a4b] text-sm font-bold text-white shadow-lg shadow-violet-200">
              SU
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">Sarvam AI</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Developer Workspace</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>

          <nav className="mt-6 space-y-2" aria-label="Primary navigation">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Inference
            </div>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[linear-gradient(100deg,rgba(99,102,241,0.18),rgba(255,128,92,0.14))] text-slate-950 shadow-sm ring-1 ring-white dark:text-white dark:ring-white/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-[#6f72ff]' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Appearance
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-11 w-full items-center justify-between rounded-xl bg-white px-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:text-slate-950 dark:bg-white/[0.055] dark:text-slate-200 dark:ring-white/10 dark:hover:text-white"
              aria-pressed={isDarkMode}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-[#9294ff]">
                  {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </span>
                Dark Mode
              </span>
              <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${isDarkMode ? 'bg-[#6f72ff]' : 'bg-slate-300'}`}>
                <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
          </div>

          <div className="flex-1" />

          <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(255,138,75,0.12))] p-4 ring-1 ring-slate-900/[0.04] dark:bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(255,138,75,0.12))] dark:ring-white/10">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5161ff] shadow-sm dark:bg-white/10 dark:text-[#898bff]">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Developer Portal</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Live model testing and output comparison.</p>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-slate-200/80 pt-4 dark:border-white/10">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#8578ff] via-[#c46bff] to-[#ff8a4b] text-sm font-bold text-white">
              SU
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">Sunny Sarjay</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">sunny@example.com</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/88 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#101216]/88 lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/playground" className="text-2xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-[#6667ff] via-[#9f6cff] to-[#ff805c] bg-clip-text text-transparent">
              sarvam
            </span>
          </Link>
          <div className="flex gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    isActive ? 'bg-indigo-50 text-[#5161ff] dark:bg-white/10 dark:text-[#898bff]' : 'text-slate-500 dark:text-slate-400'
                  }`}
                  aria-label={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            })}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 dark:text-slate-300"
              aria-label="Toggle dark mode"
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
