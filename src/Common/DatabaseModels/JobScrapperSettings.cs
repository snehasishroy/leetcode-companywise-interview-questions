using System;
using Common.Models.Public;
using PublicSettingsModel = Common.Models.Public.QuerySettings;

namespace Common.DatabaseModels
{
    public class JobScrapperSettings
    {
        public string id { get; set; }

        public string settingName { get; set; }

        public bool enabled { get; set; }

        public DateTime lastUpdated { get; set; }

        public DateTime lastRunTime { get; set; }

        public int runIntervalInMinutes { get; set; }

        public QuerySettings settings { get; set; }

        public JobScrapperSettings(string id,
            string settingName,
            int? runIntervalsInMinutes,
            PublicSettingsModel settings,
            bool enabled = false)
        {
            this.id = id;
            this.settingName = settingName;
            this.enabled = enabled;
            this.lastUpdated = DateTime.UtcNow;
            this.lastRunTime = DateTime.MinValue;
            this.runIntervalInMinutes = Math.Min(60, runIntervalsInMinutes ?? 60);
            this.settings = new QuerySettings(settings);
        }

        public void UpdateFromPublicModel(ScrapperSettings publicSettings)
        {
            if (publicSettings == null) throw new ArgumentNullException(nameof(publicSettings));

            this.enabled = publicSettings.enabled;
            this.runIntervalInMinutes = publicSettings.runIntervalInMinutes;
            this.settings = new QuerySettings(publicSettings.settings);
            this.lastUpdated = DateTime.UtcNow;
            // keep SettingName unchanged unless public model provides one
            if (!string.IsNullOrWhiteSpace(publicSettings.name))
            {
                this.settingName = publicSettings.name;
            }
        }

        public ScrapperSettings ToPublicModel()
        {
            return new ScrapperSettings
            {
                id = this.id,
                name = this.settingName,
                enabled = this.enabled,
                lastUpdated = this.lastUpdated,
                lastRunTime = this.lastRunTime,
                runIntervalInMinutes = this.runIntervalInMinutes,
                settings = new PublicSettingsModel
                {
                    query = this.settings.query,
                    locations = this.settings.locations,
                    sitesToInclude = this.settings.sitesToInclude,
                    sitesToExclude = this.settings.sitesToExclude,
                    exactTerms = this.settings.exactTerms,
                    negativeTerms = this.settings.negativeTerms,
                    additionalSearchTerms = this.settings.additionalSearchTerms,
                    lookBackDays = this.settings.lookBackDays
                }
            };
        }

        public QuerySettings GetQuerySettings()
        {
            return this.settings;
        }
    }
}