namespace Common.Models
{
    public class JobScrapperSettings
    {
        public string Id { get; set; }
        public bool Enabled { get; set; }
        public DateTime LastUpdated { get; set; }
        public DateTime LastRunTime { get; set; }
        public int RunIntervalInHours { get; set; }
        public QuerySettings Settings { get; set; }

        public JobScrapperSettings(string id, Models.Public.QuerySettings settings, bool enabled = false)
        {
            this.Id = id;
            this.Enabled = enabled;
            this.LastUpdated = DateTime.UtcNow;
            this.LastRunTime = DateTime.MinValue;
            this.RunIntervalInHours = 24; // Default to daily runs
            this.Settings = new Models.QuerySettings(settings);
        }

        public string GetQueryParameters()
        {
            return string.Empty;
        }

        public void UpdateFromPublicModel(Models.Public.ScrapperSettings publicSettings)
        {
            this.Enabled = publicSettings.enabled;
            this.RunIntervalInHours = publicSettings.runIntervalInHours;
            this.Settings = new Models.QuerySettings(publicSettings.settings);
        }

        public Models.Public.ScrapperSettings ToPublicModel()
        {
            return new Models.Public.ScrapperSettings
            {
                id = this.Id,
                enabled = this.Enabled,
                lastUpdated = this.LastUpdated,
                lastRunTime = this.LastRunTime,
                runIntervalInHours = this.RunIntervalInHours,
                settings = new Models.Public.QuerySettings
                {
                    query = this.Settings.Query,
                    location = this.Settings.Location,
                    siteToInclude = this.Settings.SiteToInclude,
                    siteToExclude = this.Settings.SiteToExclude,
                    exactTerms = this.Settings.ExactTerms,
                    negativeTerms = this.Settings.NegativeTerms
                }
            };
        }

        public override string ToString()
        {
            return $"JobScrapperSettings(Id={Id}, Enabled={Enabled}, LastUpdated={LastUpdated}, LastRunTime={LastRunTime}, RunIntervalInHours={RunIntervalInHours}, Settings=[Query={Settings.Query}, Location={Settings.Location}])";
        }
    }

    public class QuerySettings
    {
        public string Query { get; set; }
        public string Location { get; set; }
        public string SiteToInclude { get; set; }
        public string SiteToExclude { get; set; }
        public string ExactTerms { get; set; }
        public string NegativeTerms { get; set; }
        public int lookBackDays = 1;
        public string AdditionalSearchterms { get; set; }

        public QuerySettings(Models.Public.QuerySettings qs)
        {
            this.Query = qs.query;
            this.Location = qs.location;
            this.SiteToInclude = qs.siteToInclude;
            this.SiteToExclude = qs.siteToExclude;
            this.ExactTerms = qs.exactTerms;
            this.NegativeTerms = qs.negativeTerms;
            this.AdditionalSearchterms = qs.additionalTerms;
        }
    }
}