'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTrackerStore } from '@/store/useTrackerStore';
import { CompanyDetail, Problem } from '@/types';
import { getDifficultyColor, formatPercent } from '@/utils/helpers';
import { ArrowLeft, Play, ExternalLink, Bookmark, CheckSquare, Square, Star, HelpCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

type RecencyFilter = 'all' | 'thirtyDays' | 'threeMonths' | 'sixMonths' | 'moreThanSixMonths';

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  
  const { globalSearch, setGlobalSearch, setSelectedProblemId, addToast } = useTrackerStore();
  
  // Local page filters
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [recencyFilter, setRecencyFilter] = useState<RecencyFilter>('all');

  // Fetch company details
  const { data: company, isLoading, error } = useQuery<CompanyDetail>({
    queryKey: ['company', slug],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${slug}`);
      if (!res.ok) throw new Error('Company not found');
      return res.json();
    },
  });

  // Mutation to toggle solved status directly in the list
  const toggleSolveMutation = useMutation({
    mutationFn: async ({ id, solved }: { id: number; solved: boolean }) => {
      const res = await fetch(`/api/problems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solved }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company', slug] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      addToast(
        data.solved ? `Marked "${data.title}" as Solved!` : `Marked "${data.title}" as Unsolved.`,
        data.solved ? 'success' : 'info'
      );
    },
    onError: () => {
      addToast('Failed to update status.', 'error');
    },
  });

  // Reset global search when entering/leaving page
  React.useEffect(() => {
    return () => setGlobalSearch('');
  }, [setGlobalSearch]);

  // Filter questions list
  const filteredProblems = useMemo(() => {
    if (!company) return [];
    
    return company.problems.filter(prob => {
      // 1. Text Search (title or ID)
      const matchesSearch = 
        prob.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        prob.id.toString().includes(globalSearch);

      // 2. Difficulty Filter
      const matchesDifficulty = difficultyFilter === 'all' || prob.difficulty === difficultyFilter;

      // 3. Solved Status Filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'solved' && prob.solved) ||
        (statusFilter === 'unsolved' && !prob.solved);

      // 4. Recency CSV Category Filter
      let matchesRecency = true;
      if (recencyFilter !== 'all') {
        matchesRecency = !!prob.categories[recencyFilter];
      }

      return matchesSearch && matchesDifficulty && matchesStatus && matchesRecency;
    });
  }, [company, globalSearch, difficultyFilter, statusFilter, recencyFilter]);

  const handleContinueLearning = () => {
    if (!company || !company.firstUnsolved) {
      addToast('All questions solved for this company! 🎉', 'success');
      return;
    }
    const problem = company.firstUnsolved;
    // Open in LeetCode in a new tab
    window.open(problem.url, '_blank');
    // Open details modal in-app
    setSelectedProblemId(problem.id);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto text-foreground">
        <div className="h-6 w-24 bg-muted rounded-lg shimmer" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-muted rounded-lg shimmer" />
            <div className="h-5 w-44 bg-muted rounded-lg shimmer" />
          </div>
          <div className="h-12 w-48 bg-muted rounded-xl shimmer" />
        </div>
        <div className="h-16 w-full bg-muted rounded-xl shimmer" />
        <div className="h-[400px] w-full bg-muted rounded-xl shimmer mt-4" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[60vh] text-muted-foreground">
        <h3 className="text-lg font-bold text-foreground">Company Not Found</h3>
        <p className="text-sm">The company you are looking for does not exist or has no question data.</p>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { stats, name } = company;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 select-text text-foreground animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Sticky Progress Bar & Title Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Progress:</span>
            <strong className="text-foreground">{stats.solvedProblems}</strong> solved
            <span className="text-zinc-300 dark:text-zinc-800">/</span>
            <span>{stats.totalProblems} questions</span>
            <span className="text-zinc-300 dark:text-zinc-800">•</span>
            <span className="text-primary font-bold">{formatPercent(stats.completionPercentage)}</span> Complete
          </p>
        </div>

        {/* Continue Learning Button */}
        <button
          onClick={handleContinueLearning}
          className="flex items-center justify-center gap-2 px-5 py-3 border border-primary bg-primary text-black font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-xl shadow-primary/5 cursor-pointer w-full md:w-auto"
        >
          <Play className="h-4.5 w-4.5 fill-black" />
          <span>Continue Learning</span>
        </button>
      </div>

      {/* Embedded Sticky Progress Bar */}
      <div className="w-full bg-muted/60 border border-border p-4 rounded-2xl flex items-center gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-grow w-full bg-zinc-150 dark:bg-zinc-950 h-3 rounded-full overflow-hidden border border-border/50">
          <div
            className="bg-gradient-to-r from-primary to-amber-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
        <div className="flex-shrink-0 text-xs font-mono font-bold text-muted-foreground">
          {stats.solvedProblems} / {stats.totalProblems} ({stats.completionPercentage.toFixed(0)}%)
        </div>
      </div>

      {/* Recency Categories & Filters Panel */}
      <div className="flex flex-col gap-4">
        {/* Recency Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-3 flex-wrap">
          {(
            [
              { id: 'all', label: 'All Questions', icon: HelpCircle },
              { id: 'thirtyDays', label: 'Last 30 Days', icon: Calendar },
              { id: 'threeMonths', label: 'Last 3 Months', icon: Calendar },
              { id: 'sixMonths', label: 'Last 6 Months', icon: Calendar },
              { id: 'moreThanSixMonths', label: 'More than 6 Months', icon: Calendar },
            ] as const
          ).map((tab) => {
            const isActive = recencyFilter === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setRecencyFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'text-primary border-primary/50 bg-card shadow-sm font-bold'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/35'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Difficulty & Status Filters */}
        <div className="flex items-center gap-4 flex-wrap justify-between">
          {/* Left: Status filters */}
          <div className="flex items-center gap-2 bg-muted/40 p-1 border border-border rounded-xl">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'solved', label: 'Solved' },
                { id: 'unsolved', label: 'Unsolved' },
              ] as const
            ).map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-card border border-primary/50 text-primary shadow-sm'
                      : 'border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Right: Difficulty filters */}
          <div className="flex items-center gap-2 bg-muted/40 p-1 border border-border rounded-xl">
            {(
              [
                { id: 'all', label: 'All Difficulties' },
                { id: 'Easy', label: 'Easy' },
                { id: 'Medium', label: 'Medium' },
                { id: 'Hard', label: 'Hard' },
              ] as const
            ).map((d) => {
              const active = difficultyFilter === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDifficultyFilter(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-card border border-primary/50 text-primary shadow-sm'
                      : 'border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                <th className="py-4 px-6 w-12 text-center">Solved</th>
                <th className="py-4 px-6 w-20">ID</th>
                <th className="py-4 px-6">Problem Title</th>
                <th className="py-4 px-6 w-32">Difficulty</th>
                <th className="py-4 px-6 w-32">Frequency</th>
                <th className="py-4 px-6 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProblems.length > 0 ? (
                filteredProblems.map((prob) => (
                  <tr
                    key={prob.id}
                    className={`hover:bg-muted/30 transition-colors group ${
                      prob.solved ? 'opacity-80 bg-zinc-50/10 dark:bg-zinc-950/10' : ''
                    }`}
                  >
                    {/* Checkbox Solve column */}
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => toggleSolveMutation.mutate({ id: prob.id, solved: !prob.solved })}
                        disabled={toggleSolveMutation.isPending}
                        className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer flex justify-center w-full"
                      >
                        {prob.solved ? (
                          <CheckSquare className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </td>

                    {/* ID column */}
                    <td className="py-3.5 px-6 text-sm font-mono text-muted-foreground">
                      #{prob.id}
                    </td>

                    {/* Title column */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProblemId(prob.id)}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left focus:outline-none cursor-pointer"
                        >
                          {prob.title}
                        </button>
                        {prob.bookmarked && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                        {prob.notes && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border" title="Has Notes">
                            Notes
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Difficulty Badge column */}
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(prob.difficulty)}`}>
                        {prob.difficulty}
                      </span>
                    </td>

                    {/* Frequency Column */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${prob.frequency}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {formatPercent(prob.frequency)}
                        </span>
                      </div>
                    </td>

                    {/* Open Button Column */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={prob.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
                          title="Open LeetCode URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-muted-foreground text-sm">
                    No questions found matching your filters. Try checking other categories or clear the search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
