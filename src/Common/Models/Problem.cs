using Common.DatabaseModels;

namespace Common.Models
{
    public enum Difficulty
    {
        Unknown = 0,
        Easy = 1,
        Medium = 2,
        Hard = 3
    }

    public class TagName
    {
        public static string FileName = "filename";
        public static string FolderName = "foldername";
    };

    public class Problem
    {
        public Problem() { }
        public Problem(Problem ps)
        {
            this.id = ps.id;
            this.title = ps.title;
            this.url = ps.url;
            this.difficulty = ps.difficulty;
            this.acceptance = ps.acceptance;
            this.frequency = ps.frequency;
            this.companies = new Dictionary<string, List<string>>(ps.companies);
            this.metadata = new Dictionary<string, string>(ps.metadata);
        }

        public Problem(ProblemSchema ps)
        {
            this.id = ps.id;
            this.title = ps.title;
            this.url = ps.url;
            this.difficulty = ps.difficulty;
            this.acceptance = ps.acceptance;
            this.frequency = ps.frequency;
            this.companies = ps.companyList.ToDictionary(kv => kv.Key, kv => kv.Value.ToList(), StringComparer.OrdinalIgnoreCase);
            this.metadata = ps.metadataList.ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.OrdinalIgnoreCase);
        }

        public string id { get; set; } = string.Empty;
        public string title { get; set; } = string.Empty;
        public string url { get; set; } = string.Empty;
        public Difficulty difficulty { get; set; } = Difficulty.Unknown;
        public double acceptance { get; set; } = 0.0;
        public double frequency { get; set; } = 0;
        public Dictionary<string, List<string>> companies { get; set; } = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> metadata { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public override string ToString()
        {
            return $"{id}: {title} ({difficulty}) | companies: {string.Join(", ", companies.Keys)} | metadata: {string.Join(", ", metadata.Select(kv => $"{kv.Key}={kv.Value}"))}";
        }
    }    
}
