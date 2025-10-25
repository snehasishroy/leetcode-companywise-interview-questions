using Common;
using Common.Models;

namespace Backend.Filters
{
    public class ProblemFilter : IFilter<Problem>
    {
        private int skip = 0;
        private int limit = 50;
        private int shuffle = -1;
        private List<string> companies;
        private List<Difficulty> difficulties;
        private List<string> tags;

        public ProblemFilter(int skip, int limit, int shuffle, List<string>? companies, List<Difficulty>? difficulties, List<string>? tags)
        {
            this.skip = skip;
            this.limit = Math.Min(limit, 50);
            this.shuffle = shuffle;
            this.companies = companies ?? new List<string>();
            this.difficulties = difficulties ?? new List<Difficulty>();
            this.tags = tags ?? new List<string>();
        }

        public List<Problem> ApplyFilterAsync(List<Problem> problems)
        {
            List<Problem> filteredProblems = problems;

            // TODO: Add tags filtering logic with company 
            if (companies != null && companies.Count > 0 || tags != null && tags.Count > 0)
            {
                filteredProblems = filteredProblems.Where(
                    p => p.companies != null &&
                    p.companies.Any(kv =>
                        (companies == null || companies.Count == 0 || companies.Contains(kv.Key, StringComparer.OrdinalIgnoreCase)) &&
                        kv.Value.Any(t => tags == null || tags.Count == 0 || tags.Contains(t, StringComparer.OrdinalIgnoreCase)))).ToList();
            }

            if (difficulties != null && difficulties.Count > 0)
            {
                filteredProblems = filteredProblems.Where(p => difficulties.Contains(p.difficulty)).ToList();
            }

            if (shuffle != -1)
            {
                Shuffle<Problem>(filteredProblems, this.shuffle);
            }

            filteredProblems = filteredProblems.Skip(skip).Take(limit).ToList();

            return filteredProblems;
        }
        
        private static void Shuffle<T>(IList<T> list, int seed)
        {
            Random rng = new Random(seed);
            int n = list.Count;
            while (n > 1)
            {
                n--;
                int k = rng.Next(n + 1);
                (list[n], list[k]) = (list[k], list[n]);
            }
        }
    }
}