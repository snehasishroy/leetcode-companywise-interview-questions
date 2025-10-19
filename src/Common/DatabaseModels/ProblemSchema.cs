using Common.Models;

namespace Common.DatabaseModels
{
    public class ProblemSchema
    {
        public ProblemSchema() { }
        public ProblemSchema(ProblemSchema ps)
        {
            id = ps.id;
            title = ps.title;
            url = ps.url;
            difficulty = ps.difficulty;
            acceptance = ps.acceptance;
            frequency = ps.frequency;
            companyList = new List<KeyValuePair<string, List<string>>>();
            metadataList = new List<KeyValuePair<string, string>>();
        }

        public ProblemSchema(Problem p)
        {
            id = p.id;
            title = p.title;
            url = p.url;
            difficulty = p.difficulty;
            acceptance = p.acceptance;
            frequency = p.frequency;
            companyList = p.companies.Select(kv => new KeyValuePair<string, List<string>>(kv.Key, kv.Value.ToList())).ToList();
            metadataList = p.metadata.Select(kv => new KeyValuePair<string, string>(kv.Key, kv.Value)).ToList();
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
