'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTrackerStore } from '@/store/useTrackerStore';
import { RefreshCw, Database, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { Stats } from '@/types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useTrackerStore();
  const [username, setUsername] = useState('');
  const [leetcodeSession, setLeetcodeSession] = useState('');
  const [isSimulation, setIsSimulation] = useState(true);

  // Fetch current statistics (which contains sync configurations)
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
  });

  const syncConfig = stats?.syncConfig;

  // Prefill the form inputs once the settings configurations load from the DB
  useEffect(() => {
    if (syncConfig?.leetcodeUser) {
      setUsername(syncConfig.leetcodeUser);
      setIsSimulation(syncConfig.isDemoMode);
      if (syncConfig.hasSessionCookie) {
        setLeetcodeSession('••••••••••••••••');
      }
    }
  }, [syncConfig]);

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      // If session field is the dots placeholder, don't overwrite the stored cookie
      const sessionToSend = leetcodeSession === '••••••••••••••••' ? undefined : leetcodeSession;

      const res = await fetch('/api/leetcode-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          action: 'full',
          isSimulation,
          leetcodeSession: sessionToSend,
        }),
      });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      
      if (data.success) {
        addToast(
          `Sync successful! Marked ${data.syncedCount} questions as solved (${data.isDemoMode ? 'Demo' : 'Real'} mode).`,
          'success'
        );
      } else {
        addToast(data.message || 'Sync completed with no changes.', 'info');
      }
    },
    onError: () => {
      addToast('LeetCode Sync failed. Check username, cookie validity, or network.', 'error');
    },
  });

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      addToast('Please enter a valid LeetCode username.', 'error');
      return;
    }
    syncMutation.mutate();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 select-text text-foreground animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure and manage your LC tracker account settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* LeetCode Sync Panel */}
        <div className="glass border border-border rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-primary animate-pulse">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">LeetCode Auto-Sync</h2>
              <p className="text-xs text-muted-foreground">Automatically sync your solved problems list with your LeetCode profile.</p>
            </div>
          </div>

          {/* Sync warning/helper */}
          <div className="p-4 bg-muted/60 border border-border rounded-xl text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">How Sync works:</p>
              <p>
                We query the LeetCode GraphQL endpoint to retrieve your solved questions and overall solved counts.
                You can also secure <strong>100% exact question sync</strong> by providing your LeetCode Session Cookie.
                Without a cookie, older questions will be populated using representative popular questions of matching difficulties.
              </p>
            </div>
          </div>

          {/* Warning banner if demo mode solved states exist and switching to real sync */}
          {syncConfig && syncConfig.isDemoMode && !isSimulation && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-400 leading-relaxed flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <p className="font-semibold text-orange-650 dark:text-orange-350">Warning: Switching to Real Sync</p>
                <p>
                  You are switching from Demo Mode to a Real Sync. Starting a real sync will
                  automatically clear all 120 Demo Mode solved questions and start fresh with
                  your real profile's solved questions!
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSyncSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                LeetCode Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. neetcode, lc_master, or 'simulation'"
                className="bg-input-bg border border-border text-sm text-foreground rounded-xl p-3 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-650"
              />
            </div>

            {/* Authenticated Cookie Input */}
            {!isSimulation && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    LeetCode Session Cookie (Optional)
                  </label>
                  <span className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                    Paste cookie for 100% exact sync of all solved slugs.
                  </span>
                </div>
                <input
                  type="password"
                  value={leetcodeSession}
                  onChange={(e) => setLeetcodeSession(e.target.value)}
                  placeholder={syncConfig?.hasSessionCookie ? "Session cookie saved (securely stored locally)" : "Enter LEETCODE_SESSION cookie value"}
                  className="bg-input-bg border border-border text-sm text-foreground rounded-xl p-3 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-650"
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed leading-normal">
                  How to get it: Log in to LeetCode &rarr; Open DevTools (F12) &rarr; Application/Storage &rarr; Cookies &rarr; Copy the value of <strong>LEETCODE_SESSION</strong>.
                </p>
              </div>
            )}

            {/* Simulation mode switch */}
            <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border rounded-xl">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Simulation / Demonstration Mode</span>
                <span className="text-xs text-muted-foreground">Run a simulated solve import to populate the dashboard</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulation(!isSimulation)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors outline-none cursor-pointer ${
                  isSimulation ? 'bg-primary' : 'bg-muted border border-border'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-black dark:bg-black transition-transform ${
                    isSimulation ? 'translate-x-5.5' : 'translate-x-0 bg-zinc-400 dark:bg-zinc-500'
                  }`}
                />
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={syncMutation.isPending}
              className="mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-black font-bold text-sm rounded-xl hover:bg-primary/95 transition-all cursor-pointer shadow-lg shadow-primary/5"
            >
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>Syncing Solved Questions...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4.5 w-4.5" />
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </form>

          {/* Sync Stats footer */}
          {syncConfig && (
            <div className="border-t border-border pt-4 flex justify-between text-xs text-muted-foreground">
              <span>Last Synced Username: <strong className="text-foreground">{syncConfig.leetcodeUser || 'Never'}</strong></span>
              <span>Last Sync: <strong className="text-foreground">{syncConfig.lastSyncedAt ? formatDate(syncConfig.lastSyncedAt) : 'Never'}</strong></span>
            </div>
          )}
        </div>

        {/* Database Stats Panel */}
        <div className="glass border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted p-2.5 rounded-xl text-muted-foreground">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Database Info</h2>
              <p className="text-xs text-muted-foreground">Local SQLite database containing interview questions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-muted/30 border border-border rounded-xl flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider">Engine</span>
              <span className="text-sm font-bold text-foreground">Prisma client + SQLite</span>
            </div>
            <div className="p-3 bg-muted/30 border border-border rounded-xl flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider">Status</span>
              <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
