namespace Backend.Operations
{
    public class ProblemFilter : IFilter
    {
        private int skip = 0;
        private int limit = 50;
        private List<string> companies;
        private List<Common.Models.Difficulty> difficulties;
        private List<string> tags;

        public ProblemFilter(int skip, int limit, List<string>? companies, List<Common.Models.Difficulty>? difficulties, List<string>? tags)
        {
            this.skip = skip;
            this.limit = Math.Min(limit, 50);
            this.companies = companies ?? new List<string>();
            this.difficulties = difficulties ?? new List<Common.Models.Difficulty>();
            this.tags = tags ?? new List<string>();
        }

        public List<Common.Models.Problem> ApplyFilterAsync(List<Common.Models.Problem> problems)
        {
            List<Common.Models.Problem> filteredProblems = problems;

            // TODO: Add tags filtering logic with company 
            if ((companies != null && companies.Count > 0) || (tags != null && tags.Count > 0))
            {
                filteredProblems = filteredProblems.Where(
                    p => p.companies != null &&
                    p.companies.Any(kv =>
                        (this.companies == null || this.companies.Count== 0 || this.companies.Contains(kv.Key, StringComparer.OrdinalIgnoreCase)) &&
                        kv.Value.Any(t => this.tags == null || this.tags.Count == 0 || this.tags.Contains(t, StringComparer.OrdinalIgnoreCase)))).ToList();
            }

            if (difficulties != null && difficulties.Count > 0)
            {
                filteredProblems = filteredProblems.Where(p => this.difficulties.Contains(p.difficulty)).ToList();
            }
        
            filteredProblems = filteredProblems.Skip(skip).Take(limit).ToList();
        
            return filteredProblems;
        }
    }
}