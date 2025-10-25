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

            var settingsInDb = _scrapperSettingsContainer.GetItemQueryIterator<JobScrapperSettings>($"SELECT TOP 1* from ScraperSettingsContainer where Id = {id}");

            int count = 0;
            var existingSettingsList = new List<JobScrapperSettings>();
            var returnSettings = default(JobScrapperSettings);
            while (settingsInDb.HasMoreResults)
            {
                var response = await settingsInDb.ReadNextAsync();
                existingSettingsList.AddRange(response);
            }

            if(count > 0)
            {
                var existingSettings = existingSettingsList[0];
                existingSettings.UpdateFromPublicModel(publicSettings);
                await _scrapperSettingsContainer.ReplaceItemAsync<JobScrapperSettings>(
                    existingSettings,
                    existingSettings.id
                    );
                returnSettings =  existingSettings;
            }
            else
            {
                id = Guid.NewGuid().ToString();
                returnSettings = await _scrapperSettingsContainer.CreateItemAsync<JobScrapperSettings>(
                    new JobScrapperSettings(
                        id,
                        publicSettings.name,
                        publicSettings.runIntervalInMinutes,
                        publicSettings.settings,
                        true)
                    );
            }

            return returnSettings;
        }

        public async Task<JobScrapperSettings> GetSettingsById(string id)
        {
            var setting = await _scrapperSettingsContainer.ReadItemAsync<JobScrapperSettings>(
                id,
                new PartitionKey(id)
                );

            if(setting == null)
            {
                _logger.LogError($"No JobScrapperSettings found with id: {id}");
                throw new KeyNotFoundException($"No JobScrapperSettings found with id: {id}");
            }

            return setting;
        }

        public async Task<List<JobScrapperSettings>> GetAllSettings()
        {
            var settingsInDb = _scrapperSettingsContainer.GetItemQueryIterator<JobScrapperSettings>($"SELECT * from ScraperSettingsContainer");
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