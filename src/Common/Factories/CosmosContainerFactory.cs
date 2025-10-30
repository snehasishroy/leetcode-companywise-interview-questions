using Common.Constants;
using Common.Enums;
using Common.Models.Miscellaneous;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Common.Factories
{
    public class CosmosContainerFactory : ICosmosContainerFactory
    {
        private CosmosClient _cosmosClient;

        private readonly IConfiguration _configuration;

        private readonly ILogger<CosmosContainerFactory> _logger;
        public CosmosContainerFactory(CosmosClient cosmosClient,
            IConfiguration configuration,
            ILogger<CosmosContainerFactory> logger)
        {
            _cosmosClient = cosmosClient;
            _configuration = configuration;
            _logger = logger;
        }

        public Container GetContainer(CosmosContainerEnum container)
        {
            var containerDetails = LoadContainerDetails();

            if(!containerDetails.ContainsKey(container))
            {
                _logger.LogError("Container details not found for container: {Container}", container);
                throw new ArgumentOutOfRangeException(nameof(container), container, null);
            }

            var databaseName = containerDetails[container].DatabaseName;
            var containerName = containerDetails[container].ContainerName;
            var dbInstnace = _cosmosClient.GetDatabase(databaseName);
            return dbInstnace.GetContainer(containerName);
        }

        private Dictionary<CosmosContainerEnum, ContainerDetails> LoadContainerDetails()
        {
            var config = _configuration.GetSection(ConfigurationConstants.ApplicationSettings);
            return new Dictionary<CosmosContainerEnum, ContainerDetails>
            {
                { 
                    CosmosContainerEnum.ProblemsContainer, 
                    new ContainerDetails(config[ConfigurationConstants.LCProjectDatabaseNameKey], config[ConfigurationConstants.LCProjectContainerNameKey]) 
                },
                {
                    CosmosContainerEnum.JobsContainer,
                    new ContainerDetails(config[ConfigurationConstants.JobsProjectDatabaseNameKey], config[ConfigurationConstants.JobsProjectContainerNameKey])
                },
                {
                    CosmosContainerEnum.ScrapperSettingsContainer,
                    new ContainerDetails(config[ConfigurationConstants.JobsProjectDatabaseNameKey], config[ConfigurationConstants.JobsScraperSettingsContainerNameKey])
                }
            };
        }
    }
}
