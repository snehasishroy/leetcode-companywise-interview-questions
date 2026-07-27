'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTrackerStore } from '@/store/useTrackerStore';
import { Company, Stats } from '@/types';
import { Trophy, Flame, CheckCircle, TrendingUp, HelpCircle, ChevronRight, Play } from 'lucide-react';
import { formatPercent } from '@/utils/helpers';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const {
    globalSearch,
    dashboardSort,
    setDashboardSort,
    dashboardFilter,
    setDashboardFilter,
    setSelectedProblemId,
    addToast,
  } = useTrackerStore();

  // Fetch global metrics
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
  });

  // Fetch companies with query variables
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['companies', { search: globalSearch, filter: dashboardFilter, sort: dashboardSort }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: globalSearch,
        filter: dashboardFilter,
        sort: dashboardSort,
      });
      const res = await fetch(`/api/companies?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load companies');
      return res.json();
    },
  });

  const handleContinueLearning = (e: React.MouseEvent, company: Company) => {
    e.stopPropagation(); // Prevent card navigation click
    if (!company.firstUnsolved) {
      addToast(`All questions solved for ${company.name}! 🎉`, 'success');
      return;
    }
    const problem = company.firstUnsolved;
    // Open in LeetCode in new tab
    window.open(problem.url, '_blank');
    // Open details modal in-app
    setSelectedProblemId(problem.id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 select-text text-foreground">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">LC Company Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Solve interview questions by company frequency, tracks solved status, and avoids CSV editing.</p>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Solved */}
          <div className="glass border border-border rounded-2xl p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Overall Solved</span>
              <Trophy className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.overall.solvedProblems}</span>
              <span className="text-xs text-muted-foreground ml-1.5">/ {stats.overall.totalProblems} ({stats.overall.completionPercentage.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Companies Completed */}
          <div className="glass border border-border rounded-2xl p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Companies Completed</span>
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.companies.completed}</span>
              <span className="text-xs text-muted-foreground ml-1.5">/ {stats.companies.total}</span>
            </div>
          </div>

          {/* Active Companies */}
          <div className="glass border border-border rounded-2xl p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">In Progress Tracks</span>
              <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.companies.started}</span>
              <span className="text-xs text-muted-foreground ml-1.5">Companies</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="glass border border-border rounded-2xl p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Daily Streak</span>
              <Flame className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.streak}</span>
              <span className="text-xs text-muted-foreground ml-1.5">Days</span>
            </div>
          </div>
        </div>
      )}

      {/* Sorting and Filtering Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-2 bg-muted/40 p-1 border border-border rounded-xl flex-wrap">
          {(
            [
              { id: 'all', label: 'All Companies' },
              { id: 'completed', label: 'Completed' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'not-started', label: 'Not Started' },
            ] as const
          ).map((f) => {
            const active = dashboardFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setDashboardFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-card text-primary shadow-sm border border-primary/50'
                    : 'border border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Right: Sorting Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold select-none">Sort by</span>
          <select
            value={dashboardSort}
            onChange={(e) => setDashboardSort(e.target.value as any)}
            className="bg-card border border-border text-xs font-semibold text-foreground rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="most-complete">Most Complete</option>
            <option value="least-complete">Least Complete</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="most-remaining">Most Remaining</option>
          </select>
        </div>
      </div>

      {/* Companies Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-44 bg-muted rounded-2xl shimmer" />
          ))}
        </div>
      ) : companies && companies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => router.push(`/company/${company.slug}`)}
              className="glass glass-hover border border-border hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between h-44 relative group cursor-pointer"
            >
              <div>
                {/* Title and completion percent */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {company.name}
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border select-none ${
                    company.completionPercentage === 100
                      ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                      : company.solvedProblems > 0
                      ? 'text-blue-400 border-blue-500/20 bg-blue-500/10'
                      : 'text-muted-foreground border-border bg-muted/30'
                  }`}>
                    {company.completionPercentage.toFixed(0)}%
                  </span>
                </div>
                
                {/* Solved fraction */}
                <span className="text-[11px] text-muted-foreground font-semibold block mt-1.5">
                  {company.solvedProblems} <span className="text-zinc-400 dark:text-zinc-650">/</span> {company.totalProblems} Solved
                </span>
              </div>

              {/* Progress bar and button */}
              <div className="mt-4 space-y-4">
                {/* Small animated progress bar */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-border/50">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${company.completionPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <button
                    onClick={(e) => handleContinueLearning(e, company)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer py-1"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Continue Learning
                  </button>

                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-0.5">
                    View Tracks
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground text-sm flex flex-col items-center justify-center gap-2 select-none">
          <HelpCircle className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
          <span>No companies found matching your search.</span>
        </div>
      )}
    </div>
  );
}
