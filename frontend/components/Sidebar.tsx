'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTrackerStore } from '@/store/useTrackerStore';
import { LayoutDashboard, BarChart3, Settings, Code2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useTrackerStore();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Statistics', href: '/statistics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <motion.div
      animate={{ width: sidebarOpen ? 240 : 70 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass border-r border-border flex flex-col h-screen sticky top-0 text-muted-foreground select-none z-30 relative"
    >
      {/* Floating Border Toggle Button (Linear/Notion style) */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-50 h-6 w-6 bg-card border border-border text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-all hover:bg-muted focus:outline-none"
        title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {/* Brand header */}
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-3 w-full justify-center sidebarOpen:justify-start">
          <div className="bg-primary p-2 rounded-lg flex items-center justify-center text-black flex-shrink-0">
            <Code2 className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-foreground tracking-tight whitespace-nowrap"
            >
              LC Tracker
            </motion.span>
          )}
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'text-foreground bg-secondary border border-border shadow-inner'
                  : 'hover:text-foreground hover:bg-muted/50 border border-transparent'
              }`}
            >
              <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-primary' : 'text-muted-foreground dark:text-zinc-500'}`}>
                <Icon className="h-5 w-5 flex-shrink-0" />
              </div>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.name}
                </motion.span>
              )}
              
              {/* Tooltip when collapsed */}
              {!sidebarOpen && (
                <div className="absolute left-16 bg-popover border border-border text-foreground text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
