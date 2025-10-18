namespace Common.Models.Public
{
    public class ScrapperSettings
    {
        public string id { get; set; }
        public bool enabled { get; set; }
        public DateTime lastUpdated { get; set; }
        public DateTime lastRunTime { get; set; }
        public int runIntervalInHours { get; set; }
        public QuerySettings settings { get; set; }
    }

    public class QuerySettings
    {
        public string query { get; set; }
        public string location { get; set; }
        public string siteToInclude { get; set; }
        public string siteToExclude { get; set; }
        public string exactTerms { get; set; }
        public string negativeTerms { get; set; }
        public string additionalTerms { get; set; }
    }
}