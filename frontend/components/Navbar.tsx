'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTrackerStore } from '@/store/useTrackerStore';
import { Search, Flame, Trophy, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Stats } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { globalSearch, setGlobalSearch, addToast } = useTrackerStore();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  // Load and apply theme on start
  React.useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('light', savedTheme === 'light');
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  };

  // Fetch stats for the Navbar indicator
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 20000,
  });

  const leetcodeUser = stats?.syncConfig?.leetcodeUser;
  const isDemoMode = stats?.syncConfig?.isDemoMode;

  // Background incremental sync every 60 seconds
  React.useEffect(() => {
    if (!leetcodeUser || isDemoMode) return;

    const intervalId = setInterval(async () => {
      try {
        setIsSyncing(true);
        const res = await fetch('/api/leetcode-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: leetcodeUser,
            action: 'incremental',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.syncedCount > 0) {
            addToast(`Auto-Sync: Found and marked ${data.syncedCount} new question(s) solved!`, 'success');
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['company'] });
          }
        }
      } catch (err) {
        console.error('Background incremental sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [leetcodeUser, isDemoMode, addToast, queryClient]);

  const getPlaceholderText = () => {
    if (pathname.startsWith('/company/')) {
      return 'Search questions inside this company...';
    }
    return 'Search 650+ companies...';
  };

  return (
    <header className="glass-blur h-16 border-b border-border flex items-center justify-between px-6 sticky top-0 z-20 w-full text-foreground select-none">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder={getPlaceholderText()}
          className="w-full bg-input-bg border border-border text-sm text-foreground rounded-xl py-2 pl-9 pr-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-zinc-500"
        />
        {globalSearch && (
          <button
            onClick={() => setGlobalSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Stats & Profile items */}
      <div className="flex items-center gap-5">
        {/* Sync Status Badge */}
        {leetcodeUser && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/80 border border-border rounded-xl text-xs select-none">
            {isSyncing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Syncing...</span>
              </>
            ) : (
              <>
                <div className={`h-1.5 w-1.5 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate max-w-[120px]">
                  {isDemoMode ? 'Demo Mode' : `Synced: ${leetcodeUser}`}
                </span>
              </>
            )}
          </div>
        )}

        {/* Streak counter */}
        {stats && stats.streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-semibold select-none animate-pulse">
            <Flame className="h-4 w-4 fill-amber-500" />
            <span>{stats.streak} Day Streak</span>
          </div>
        )}

        {/* Global Progress mini-indicator */}
        {stats && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Solved</div>
              <div className="text-sm font-bold text-foreground">
                {stats.overall.solvedProblems} <span className="text-muted-foreground">/ {stats.overall.totalProblems}</span>
              </div>
            </div>
            <div className="w-16 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.overall.completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Link to settings */}
        <div className="h-4 w-[1px] bg-border hidden sm:block" />

        {/* Premium aesthetics controls */}
        <div className="flex items-center gap-3">
          <label className="ui-switch flex-shrink-0" title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}>
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={handleToggleTheme}
            />
            <div className="slider">
              <div className="circle"></div>
            </div>
          </label>
          
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            LeetCode
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
