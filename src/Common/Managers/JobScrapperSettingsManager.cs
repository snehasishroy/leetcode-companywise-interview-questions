namespace Common.Managers
{
    using Common.DatabaseModels;
    using Common.Enums;
    using Common.Factories;
    using Common.Models.Public;
    using Microsoft.Azure.Cosmos;
    using Microsoft.Extensions.Logging;
    public class JobScrapperSettingsManager
    {
        private readonly Container _scrapperSettingsContainer;
        private readonly ILogger<JobScrapperSettingsManager> _logger;

        public JobScrapperSettingsManager(ICosmosContainerFactory cosmosContainerFactory,
            ILogger<JobScrapperSettingsManager> logger)
        {
            _scrapperSettingsContainer = cosmosContainerFactory.GetContainer(CosmosContainerEnum.ScrapperSettingsContainer);
            _logger = logger;
        }

        public async Task<JobScrapperSettings> CreateOrUpdateSettings(string id, ScrapperSettings publicSettings)
        {
            if(publicSettings == null)
            {
                throw new ArgumentNullException(nameof(publicSettings), "Public settings cannot be null");
            }

            var settingsInDb =  await this.GetAllSettings();
            JobScrapperSettings current = null;
            if(!string.IsNullOrEmpty(id) && settingsInDb.Any(s => s.id.Equals(id, StringComparison.OrdinalIgnoreCase)))
            {
                current = settingsInDb.First(s => s.id.Equals(id, StringComparison.OrdinalIgnoreCase));
            }

            if (current != null)
            {
                current.UpdateFromPublicModel(publicSettings);
            }
            else
            {   // TODO: Restrict total number of settings to 5
                if (settingsInDb.Count >= 5)
                {
                    throw new InvalidOperationException("[TooManySettings]: Cannot create more than 5 scrapper settings.");
                }
                current = new JobScrapperSettings(id, publicSettings.name, publicSettings.runIntervalInMinutes, publicSettings.settings, true);
            }
            
            await _scrapperSettingsContainer.UpsertItemAsync<JobScrapperSettings>(current);
            return current;
        }

        public async Task<JobScrapperSettings> GetSettingsById(string id)
        {
            var allSettings = await GetAllSettings();
            var setting = allSettings.FirstOrDefault(s => s.id.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (setting == null)
            {
                _logger.LogError($"No JobScrapperSettings found with id: {id}");
                throw new KeyNotFoundException($"No JobScrapperSettings found with id: {id}");
            }

            return setting;
        }
        
        public async Task<bool> UpdateSettingsAsync(string id, JobScrapperSettings jobSetting)
        {
            try
            {
                await _scrapperSettingsContainer.UpsertItemAsync<JobScrapperSettings>(jobSetting, new PartitionKey(id));
                _logger.LogInformation($"Successfully updated JobScrapperSettings with id: {id}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating JobScrapperSettings with id: {id}. Exception: {ex.Message}");
                return false;
            }
            return true;
        }

        public async Task<List<JobScrapperSettings>> GetAllSettings()
        {
            var settingsInDb = _scrapperSettingsContainer.GetItemQueryIterator<JobScrapperSettings>($"SELECT * from c");
            var allSettings = new List<JobScrapperSettings>();
            while (settingsInDb.HasMoreResults)
            {
                var response = await settingsInDb.ReadNextAsync();
                allSettings.AddRange(response);
            }
            return allSettings;
        }
    }
}