namespace Common.Models
{
    public class ProblemSchema
    {
        public ProblemSchema() { }
        public ProblemSchema(ProblemSchema ps)
        {
            this.id = ps.id;
            this.title = ps.title;
            this.url = ps.url;
            this.difficulty = ps.difficulty;
            this.acceptance = ps.acceptance;
            this.frequency = ps.frequency;
            this.companyList = new List<KeyValuePair<string, List<string>>>();
            this.metadataList = new List<KeyValuePair<string, string>>();
        }

        public ProblemSchema(Problem p)
        {
            this.id = p.id;
            this.title = p.title;
            this.url = p.url;
            this.difficulty = p.difficulty;
            this.acceptance = p.acceptance;
            this.frequency = p.frequency;
            this.companyList = p.companies.Select(kv => new KeyValuePair<string, List<string>>(kv.Key, kv.Value.ToList())).ToList();
            this.metadataList = p.metadata.Select(kv => new KeyValuePair<string, string>(kv.Key, kv.Value)).ToList();
        }

        public string id { get; set; } = string.Empty;
        public string title { get; set; } = string.Empty;
        public string url { get; set; } = string.Empty;
        public Difficulty difficulty { get; set; } = Difficulty.Unknown;
        public double acceptance { get; set; } = 0.0;
        public double frequency { get; set; } = 0;
        public List<KeyValuePair<string, List<string>>> companyList { get; set; } = new List<KeyValuePair<string, List<string>>>();
        public List<KeyValuePair<string, string>> metadataList { get; set; } = new List<KeyValuePair<string, string>>();

        public override string ToString()
        {
            return $"{id}: {title} ({difficulty}) | companies: {string.Join(", ", companyList.Select(c => c.Key))} | metadata: {string.Join(", ", metadataList.Select(kv => $"{kv.Key}={kv.Value}"))}";
        }
    }
}
