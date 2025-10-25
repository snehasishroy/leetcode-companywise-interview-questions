using Common.DatabaseModels;
using Common.Enums;
using Common.Factories;
using Common.Managers;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Repositories
{
    public class JobScrapperSettingsRepository
    {
        private readonly Container _scrapperSettingsContainer;
        private readonly ILogger<JobScrapperSettingsRepository> _logger;

        public JobScrapperSettingsRepository(ICosmosContainerFactory cosmosContainerFactory,
            ILogger<JobScrapperSettingsRepository> logger)
        {
            _scrapperSettingsContainer = cosmosContainerFactory.GetContainer(CosmosContainerEnum.ScrapperSettingsContainer);
            _logger = logger;
        }

        public async Task<List<JobScrapperSettings>> GetAllSettings()
        {
            var settingsInDb = _scrapperSettingsContainer.GetItemQueryIterator<JobScrapperSettings>($"SELECT * from JobScrapperSettings");
            var allSettings = new List<JobScrapperSettings>();
            while (settingsInDb.HasMoreResults)
            {
                var response = await settingsInDb.ReadNextAsync();
                allSettings.AddRange(response);
            }
            return allSettings;
        }

        public async Task UpdateSettingsAsync(string id, JobScrapperSettings jobSetting)
        {
            try
            {
                await _scrapperSettingsContainer.UpsertItemAsync<JobScrapperSettings>(jobSetting, new PartitionKey(id));
                _logger.LogInformation($"Successfully updated JobScrapperSettings with id: {id}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating JobScrapperSettings with id: {id}. Exception: {ex.Message}");
                throw;
            }
        }
    }
}
