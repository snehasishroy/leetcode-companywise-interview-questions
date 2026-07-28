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

  const [page, setPage] = React.useState(1);

  // Reset page when filters or search change
  React.useEffect(() => {
    setPage(1);
  }, [globalSearch, dashboardSort, dashboardFilter]);

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
    queryKey: ['companies', { search: globalSearch, filter: dashboardFilter, sort: dashboardSort, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: globalSearch,
        filter: dashboardFilter,
        sort: dashboardSort,
        page: page.toString(),
        limit: '60',
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
          <div className="glass border border-border hover:border-amber-500/50 hover:bg-amber-500/[0.04] hover:shadow-xl hover:shadow-amber-500/10 rounded-2xl p-5 flex flex-col justify-between h-28 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/0 group-hover:bg-amber-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Overall Solved</span>
              <Trophy className="h-4.5 w-4.5 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.overall.solvedProblems}</span>
              <span className="text-xs text-muted-foreground ml-1.5">/ {stats.overall.totalProblems} ({stats.overall.completionPercentage.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Companies Completed */}
          <div className="glass border border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] hover:shadow-xl hover:shadow-emerald-500/10 rounded-2xl p-5 flex flex-col justify-between h-28 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/0 group-hover:bg-emerald-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Companies Completed</span>
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.companies.completed}</span>
              <span className="text-xs text-muted-foreground ml-1.5">/ {stats.companies.total}</span>
            </div>
          </div>

          {/* Active Companies */}
          <div className="glass border border-border hover:border-blue-500/50 hover:bg-blue-500/[0.04] hover:shadow-xl hover:shadow-blue-500/10 rounded-2xl p-5 flex flex-col justify-between h-28 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/0 group-hover:bg-blue-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">In Progress Tracks</span>
              <TrendingUp className="h-4.5 w-4.5 text-blue-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{stats.companies.started}</span>
              <span className="text-xs text-muted-foreground ml-1.5">Companies</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="glass border border-border hover:border-orange-500/50 hover:bg-orange-500/[0.04] hover:shadow-xl hover:shadow-orange-500/10 rounded-2xl p-5 flex flex-col justify-between h-28 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/0 group-hover:bg-orange-500/20 rounded-full blur-xl transition-all duration-500 pointer-events-none" />
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Daily Streak</span>
              <Flame className="h-4.5 w-4.5 text-orange-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((company) => {
              const isCompleted = company.completionPercentage === 100;
              const isStarted = company.solvedProblems > 0;

              return (
                <div
                  key={company.id}
                  onClick={() => router.push(`/company/${company.slug}`)}
                  className={`glass border rounded-2xl p-5 flex flex-col justify-between h-44 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                    isCompleted
                      ? 'border-border hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 hover:bg-emerald-500/[0.04]'
                      : isStarted
                      ? 'border-border hover:border-primary/65 hover:shadow-xl hover:shadow-primary/10 hover:bg-primary/[0.04]'
                      : 'border-border hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:bg-indigo-500/[0.04]'
                  }`}
                >
                  {/* Background Ambient Glow */}
                  <div
                    className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
                      isCompleted
                        ? 'bg-emerald-500/0 group-hover:bg-emerald-500/20'
                        : isStarted
                        ? 'bg-primary/0 group-hover:bg-primary/20'
                        : 'bg-indigo-500/0 group-hover:bg-indigo-500/15'
                    }`}
                  />

                  <div>
                    {/* Title and completion percent */}
                    <div className="flex justify-between items-start gap-2 relative z-10">
                      <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors truncate">
                        {company.name}
                      </h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border select-none transition-transform duration-300 group-hover:scale-105 ${
                        isCompleted
                          ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/15'
                          : isStarted
                          ? 'text-blue-400 border-blue-500/30 bg-blue-500/15'
                          : 'text-muted-foreground border-border bg-muted/40'
                      }`}>
                        {company.completionPercentage.toFixed(0)}%
                      </span>
                    </div>
                    
                    {/* Solved fraction */}
                    <span className="text-[11px] text-muted-foreground font-semibold block mt-1.5 relative z-10">
                      {company.solvedProblems} <span className="text-muted-foreground/60">/</span> {company.totalProblems} Solved
                    </span>
                  </div>

                  {/* Progress bar and button */}
                  <div className="mt-4 space-y-3.5 relative z-10">
                    {/* Small animated progress bar */}
                    <div className="w-full bg-muted/80 h-1.5 rounded-full overflow-hidden border border-border/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                            : 'bg-primary group-hover:shadow-[0_0_10px_rgba(255,161,22,0.7)]'
                        }`}
                        style={{ width: `${company.completionPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        onClick={(e) => handleContinueLearning(e, company)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-primary/10"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Continue Learning
                      </button>

                      <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                        View Tracks
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 text-xs font-bold border border-border rounded-xl bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous Page
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              Page {page}
            </span>
            <button
              disabled={companies.length < 60}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-xs font-bold border border-border rounded-xl bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next Page
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground text-sm flex flex-col items-center justify-center gap-2 select-none">
          <HelpCircle className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
          <span>No companies found matching your search.</span>
        </div>
      )}
    </div>
  );
}
