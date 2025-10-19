using Common;
using Common.Models;

namespace Backend.Filters
{
    public class ProblemFilter : IFilter<Problem>
    {
        private int skip = 0;
        private int limit = 50;
        private List<string> companies;
        private List<Difficulty> difficulties;
        private List<string> tags;

        public ProblemFilter(int skip, int limit, List<string>? companies, List<Difficulty>? difficulties, List<string>? tags)
        {
            this.skip = skip;
            this.limit = Math.Min(limit, 50);
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
                        (companies == null || companies.Count== 0 || companies.Contains(kv.Key, StringComparer.OrdinalIgnoreCase)) &&
                        kv.Value.Any(t => tags == null || tags.Count == 0 || tags.Contains(t, StringComparer.OrdinalIgnoreCase)))).ToList();
            }

            if (difficulties != null && difficulties.Count > 0)
            {
                filteredProblems = filteredProblems.Where(p => difficulties.Contains(p.difficulty)).ToList();
            }
        
            filteredProblems = filteredProblems.Skip(skip).Take(limit).ToList();
        
            return filteredProblems;
        }
    }
}