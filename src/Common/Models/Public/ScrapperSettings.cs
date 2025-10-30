namespace Common.Models.Public
{
    public class ScrapperSettings
    {
        public string id { get; set; }
        public string name { get; set; }
        public bool enabled { get; set; }
        public DateTime lastUpdated { get; set; }
        public DateTime lastRunTime { get; set; }
        public int runIntervalInMinutes { get; set; }
        public QuerySettings settings { get; set; }
    }
}