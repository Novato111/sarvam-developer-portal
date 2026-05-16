// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, SplitSquareHorizontal, Settings, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Playground', href: '/playground', icon: Terminal },
    { name: 'Model Diff', href: '/diff-viewer', icon: SplitSquareHorizontal },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 text-gray-300 flex flex-col border-r border-gray-800 fixed left-0 top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center text-white font-bold text-lg">
          S
        </div>
        <span className="text-white font-semibold tracking-wide">Developer Portal</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
          Inference Tools
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 font-medium' 
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Mock Settings */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-gray-800 hover:text-white transition-colors text-sm">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-gray-800 hover:text-white transition-colors text-sm">
          <HelpCircle className="w-4 h-4" /> Documentation
        </button>
      </div>
    </div>
  );
}