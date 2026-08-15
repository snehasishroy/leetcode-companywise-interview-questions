'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrackerStore } from '@/store/useTrackerStore';
import { X, ExternalLink, Building2, Star, Save, Clipboard } from 'lucide-react';
import { getDifficultyColor, formatPercent } from '@/utils/helpers';
import AnimatedList from '@/components/AnimatedList';

interface ProblemDetail {
  id: number;
  title: string;
  url: string;
  difficulty: string;
  solved: boolean;
  notes: string;
  bookmarked: boolean;
  companies: Array<{
    id: number;
    name: string;
    slug: string;
    frequency: number;
  }>;
}

export default function ProblemModal() {
  const queryClient = useQueryClient();
  const { selectedProblemId, setSelectedProblemId, addToast } = useTrackerStore();
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch problem details
  const { data: problem, isLoading, error } = useQuery<ProblemDetail>({
    queryKey: ['problem', selectedProblemId],
    queryFn: async () => {
      if (!selectedProblemId) return null;
      const res = await fetch(`/api/problems/${selectedProblemId}`);
      if (!res.ok) throw new Error('Problem not found');
      return res.json();
    },
    enabled: !!selectedProblemId,
  });

  // Sync state notes when data is loaded
  useEffect(() => {
    if (problem) {
      setNotesText(problem.notes || '');
    }
  }, [problem]);

  // Mutation to toggle bookmark
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (bookmarked: boolean) => {
      const res = await fetch(`/api/problems/${selectedProblemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['problem', selectedProblemId] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      addToast(data.bookmarked ? 'Added problem to Bookmarks' : 'Removed from Bookmarks', 'success');
    },
  });

  // Mutation to save notes
  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      setIsSavingNotes(true);
      const res = await fetch(`/api/problems/${selectedProblemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem', selectedProblemId] });
      addToast('Notes saved successfully', 'success');
      setIsSavingNotes(false);
    },
    onError: () => {
      addToast('Failed to save notes.', 'error');
      setIsSavingNotes(false);
    },
  });

  if (!selectedProblemId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedProblemId(null)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="glass-blur w-full max-w-3xl rounded-2xl border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] text-foreground"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-start justify-between gap-4 flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-muted-foreground font-mono text-sm">#{selectedProblemId}</span>
                {problem && (
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                )}
                {problem?.solved && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold select-none flex items-center gap-1">
                    ✓ Solved
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mt-2 select-text">
                {isLoading ? 'Loading Problem...' : problem?.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {problem && (
                <button
                  onClick={() => toggleBookmarkMutation.mutate(!problem.bookmarked)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    problem.bookmarked
                      ? 'border-yellow-500/40 text-yellow-500 bg-yellow-500/10 shadow-sm'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={problem.bookmarked ? 'Remove bookmark' : 'Star/Bookmark problem'}
                >
                  <Star 
                    fill={problem.bookmarked ? "currentColor" : "none"} 
                    className={`h-5 w-5 ${problem.bookmarked ? 'text-yellow-500' : ''}`} 
                  />
                </button>
              )}
              <button
                onClick={() => setSelectedProblemId(null)}
                className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Loading / Error states */}
          {isLoading && (
            <div className="flex-1 p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>Fetching details from database...</span>
            </div>
          )}

          {error && (
            <div className="flex-1 p-12 flex flex-col items-center justify-center gap-3 text-rose-500 text-sm">
              <span>Could not load problem details.</span>
              <button
                onClick={() => setSelectedProblemId(null)}
                className="px-4 py-2 bg-muted border border-border text-foreground rounded-xl hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          )}

          {/* Body */}
          {problem && (
            <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Actions & Notes */}
              <div className="md:col-span-7 flex flex-col gap-5">
                {/* Actions Panel */}
                <div className="bg-muted/40 border border-border p-4 rounded-xl flex items-center justify-between gap-4">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-primary bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 cursor-pointer"
                  >
                    <span>Solve on LeetCode</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Notes Block */}
                <div className="flex-grow flex flex-col gap-2 min-h-[200px]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Clipboard className="h-4 w-4 text-primary" />
                      Notes
                    </label>
                    <button
                      onClick={() => saveNotesMutation.mutate(notesText)}
                      disabled={isSavingNotes || problem.notes === notesText}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        problem.notes !== notesText
                          ? 'border-primary/30 text-primary bg-primary/10 hover:bg-primary/20'
                          : 'border-border text-muted-foreground bg-transparent pointer-events-none'
                      }`}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </div>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Write down notes, solutions approaches, or key reminders here..."
                    className="w-full flex-grow bg-input-bg border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[160px]"
                  />
                </div>
              </div>

              {/* Right Column: Company Listings */}
              <div className="md:col-span-5 flex flex-col gap-3 max-h-[400px] md:max-h-full">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" />
                  Companies ({problem.companies.length})
                </div>

                {/* Helper Banner for Duplicate Detection */}
                {problem.companies.length > 1 && (
                  <div className="p-3 bg-muted/60 border border-border rounded-xl text-[11px] text-muted-foreground leading-relaxed select-none">
                    ⭐ This problem exists in <strong className="text-foreground">{problem.companies.length} companies</strong>.
                    Solving it updates progress for all of them simultaneously!
                  </div>
                )}

                <div className="flex-grow min-h-0">
                  <AnimatedList
                    items={problem.companies}
                    showGradients={false}
                    displayScrollbar={problem.companies.length > 5}
                    enableArrowNavigation={false}
                    renderItem={(cp, index, isSelected) => (
                      <div
                        className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-muted/80 border-primary/50 text-primary'
                            : 'bg-muted/20 border-border text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-sm font-semibold">{cp.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">Freq:</span>
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            {formatPercent(cp.frequency)}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
