'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stats } from '@/types';
import { formatDate } from '@/utils/helpers';
import { BarChart3, Trophy, Flame, Calendar, CircleDot, ChevronRight, Activity, TrendingUp, Star } from 'lucide-react';
import { getDifficultyColor } from '@/utils/helpers';
import { useTrackerStore } from '@/store/useTrackerStore';
import AnimatedList from '@/components/AnimatedList';

export default function StatisticsPage() {
  const { setSelectedProblemId } = useTrackerStore();

  // Fetch statistics
  const { data: stats, isLoading, error } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto text-foreground">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-muted rounded-lg shimmer" />
          <div className="h-5 w-64 bg-muted rounded-lg shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <div className="lg:col-span-7 h-80 bg-muted rounded-2xl shimmer" />
          <div className="lg:col-span-5 h-80 bg-muted rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground select-none">
        <p>Could not load statistics dashboard. Make sure database is seeded.</p>
      </div>
    );
  }

  const { overall, difficulties, companies, todaySolvedCount, streak, recentActivity } = stats;

  const difficultyItems = [
    {
      name: 'Easy',
      stats: difficulties.easy,
      color: 'bg-emerald-500',
      text: 'text-emerald-500',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
    },
    {
      name: 'Medium',
      stats: difficulties.medium,
      color: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
    },
    {
      name: 'Hard',
      stats: difficulties.hard,
      color: 'bg-rose-500',
      text: 'text-rose-500',
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 select-text text-foreground animate-in fade-in duration-305">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Statistics</h1>
        <p className="text-sm text-muted-foreground mt-1">Detailed performance metrics and daily progression summary.</p>
      </div>

      {/* Grid of 4 Key Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Solved */}
        <div className="glass border border-border hover:border-amber-500/50 hover:bg-amber-500/[0.04] hover:shadow-xl hover:shadow-amber-500/10 rounded-2xl p-5 flex flex-col justify-between h-32 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/0 group-hover:bg-amber-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
          <div className="flex justify-between items-start text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">Total Solved</span>
            <Trophy className="h-5 w-5 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
          </div>
          <div className="mt-2 relative z-10">
            <span className="text-3xl font-black text-foreground">{overall.solvedProblems}</span>
            <span className="text-xs text-muted-foreground ml-1.5">/ {overall.totalProblems} ({overall.completionPercentage.toFixed(1)}%)</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 relative z-10">Unique LeetCode questions completed</div>
        </div>

        {/* Current Streak */}
        <div className="glass border border-border hover:border-orange-500/50 hover:bg-orange-500/[0.04] hover:shadow-xl hover:shadow-orange-500/10 rounded-2xl p-5 flex flex-col justify-between h-32 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/0 group-hover:bg-orange-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
          <div className="flex justify-between items-start text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">Active Streak</span>
            <Flame className="h-5 w-5 text-orange-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="mt-2 relative z-10">
            <span className="text-3xl font-black text-foreground">{streak}</span>
            <span className="text-xs text-muted-foreground ml-1.5">Days</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 relative z-10">Solve daily to build your momentum</div>
        </div>

        {/* Solved Today */}
        <div className="glass border border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] hover:shadow-xl hover:shadow-emerald-500/10 rounded-2xl p-5 flex flex-col justify-between h-32 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/0 group-hover:bg-emerald-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
          <div className="flex justify-between items-start text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">Solved Today</span>
            <Calendar className="h-5 w-5 text-emerald-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
          </div>
          <div className="mt-2 relative z-10">
            <span className="text-3xl font-black text-foreground">{todaySolvedCount}</span>
            <span className="text-xs text-muted-foreground ml-1.5">Questions</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 relative z-10">Questions marked solved in last 24h</div>
        </div>

        {/* Companies Completed */}
        <div className="glass border border-border hover:border-blue-500/50 hover:bg-blue-500/[0.04] hover:shadow-xl hover:shadow-blue-500/10 rounded-2xl p-5 flex flex-col justify-between h-32 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/0 group-hover:bg-blue-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
          <div className="flex justify-between items-start text-muted-foreground relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">Companies Solved</span>
            <CircleDot className="h-5 w-5 text-blue-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
          </div>
          <div className="mt-2 relative z-10">
            <span className="text-3xl font-black text-foreground">{companies.completed}</span>
            <span className="text-xs text-muted-foreground ml-1.5">/ {companies.total} ({companies.started} active)</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 relative z-10">Companies where all CSV problems are solved</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Difficulty breakdown */}
        <div className="glass border border-border rounded-2xl p-6 lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Difficulty Breakdown</h2>
          </div>

          <div className="flex flex-col gap-5 flex-grow justify-center">
            {difficultyItems.map((item) => {
              const { solved, total } = item.stats;
              const percent = total > 0 ? (solved / total) * 100 : 0;
              return (
                <div key={item.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${item.text} ${item.border} ${item.bg}`}>
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {solved} <span className="text-muted-foreground">/ {total} ({percent.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900 border border-border h-3.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Recent Activity */}
        <div className="glass border border-border rounded-2xl p-6 lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Recent Solves</h2>
          </div>

          <div className="flex-grow min-h-0">
            {recentActivity.length > 0 ? (
              <AnimatedList
                items={recentActivity}
                onItemSelect={(act) => setSelectedProblemId(act.problemId)}
                displayScrollbar={true}
                showGradients={true}
                enableArrowNavigation={true}
                renderItem={(act, index, isSelected) => (
                  <div
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition-all duration-200 group ${
                      isSelected
                        ? 'bg-muted/80 border-primary/50 text-primary shadow-sm'
                        : 'bg-muted/20 border-border hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className={`text-xs font-bold truncate transition-colors ${
                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}>
                        {act.problemTitle}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-colors flex-shrink-0 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`} />
                  </div>
                )}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground text-xs select-none">
                <span>No problems solved recently. Sync your LeetCode profile to see activity.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Starred / Bookmarked Questions Section */}
      <div className="glass border border-border rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star fill="currentColor" className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-foreground">Starred Questions</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              {stats.bookmarkedCount || 0}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Click any problem to view details & notes</span>
        </div>

        {stats.bookmarkedProblems && stats.bookmarkedProblems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.bookmarkedProblems.map((prob) => (
              <div
                key={prob.id}
                onClick={() => setSelectedProblemId(prob.id)}
                className="p-4 bg-muted/20 border border-border hover:border-yellow-500/40 hover:bg-yellow-500/[0.03] rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">#{prob.id}</span>
                    <span className={`px-2 py-0.2 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>
                    {prob.solved && (
                      <span className="text-[10px] text-emerald-500 font-bold">✓ Solved</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground group-hover:text-yellow-500 transition-colors truncate">
                    {prob.title}
                  </span>
                </div>
                <Star fill="currentColor" className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 select-none">
            <Star className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            <span>No starred questions yet. Click the star icon on any question modal to bookmark it for quick review!</span>
          </div>
        )}
      </div>
    </div>
  );
}
