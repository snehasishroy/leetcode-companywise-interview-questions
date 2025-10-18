namespace Backend.Operations
{
    using System.Collections.Concurrent;
    using System.Globalization;
    using System.Reflection.Metadata.Ecma335;
    using Common.Models;

    public class JobScrapperSettingsManager
    {
        private ConcurrentDictionary<string, JobScrapperSettings> settingsStore = new ConcurrentDictionary<string, JobScrapperSettings>(StringComparer.OrdinalIgnoreCase);
        
        public JobScrapperSettingsManager() {}

        public JobScrapperSettings CreateOrUpdateSettings(string id, Common.Models.Public.ScrapperSettings publicSettings)
        {
            var newSettings = new JobScrapperSettings(
                id,
                publicSettings.settings,
                false); // Initially disabled

            settingsStore.AddOrUpdate(id, newSettings, (key, value) =>
            {
                value.UpdateFromPublicModel(publicSettings);
                value.LastUpdated = DateTime.UtcNow;
                return value;
            });
            
            return settingsStore[id];
        }

        public JobScrapperSettings GetSettingsById(string id)
        {
            if(settingsStore.TryGetValue(id, out var settings))
            {
                return settings;
            }
            return new JobScrapperSettings("NOT FOUND", new Common.Models.Public.QuerySettings(), false);
        }

        public List<JobScrapperSettings> GetAllSettings()
        {
            return settingsStore.Values.ToList();
        }

        public void UpdateLastRunTime(string id, DateTime runTime)
        {
            if(settingsStore.TryGetValue(id, out var settings))
            {
                settings.LastRunTime = runTime;
                settingsStore[id] = settings;
            }
        }
    }
}