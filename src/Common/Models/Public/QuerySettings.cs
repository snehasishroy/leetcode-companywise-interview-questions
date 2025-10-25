namespace Common.Models.Public
{

    public class QuerySettings
    {
        public string query { get; set; }
        public List<string> locations { get; set; }
        public List<string> sitesToInclude { get; set; }
        public List<string> sitesToExclude { get; set; }
        public List<string> exactTerms { get; set; }
        public List<string> negativeTerms { get; set; }
        public List<string> additionalTerms { get; set; }
        public int lookBackDays { get; set; }
    }
}
