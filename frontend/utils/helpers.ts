export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'medium':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'hard':
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    default:
      return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
  }
}

export function formatPercent(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val / 100);
}

export function formatDate(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDifficultyBg(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-emerald-500';
    case 'medium':
      return 'bg-amber-500';
    case 'hard':
      return 'bg-rose-500';
    default:
      return 'bg-zinc-500';
  }
}
