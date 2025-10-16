using Common.Constants;
using Common.Enums;
using Common.Models.Miscellaneous;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;

namespace Common.Factories
{
    public class CosmosContainerFactory : ICosmosContainerFactory
    {
        private CosmosClient _cosmosClient;

        private readonly IConfiguration _configuration;

        public CosmosContainerFactory(CosmosClient cosmosClient, IConfiguration configuration)
        {
            _cosmosClient = cosmosClient;
            _configuration = configuration;
        }

        public Container GetContainer(CosmosContainerEnum container)
        {
            var containerDetails = LoadContainerDetails();
            switch (container)
            {
                case CosmosContainerEnum.ProblemsContainer:
                    var dbId = containerDetails[container].DatabaseName;
                    var containerId = containerDetails[container].ContainerName;
                    var db = _cosmosClient.GetDatabase(dbId);
                    return db.GetContainer(containerId);
                default:
                    throw new ArgumentOutOfRangeException(nameof(container), container, null);
            }
        }

        private Dictionary<CosmosContainerEnum, ContainerDetails> LoadContainerDetails()
        {
            var config = _configuration.GetSection(ConfigurationConstants.ApplicationSettings);
            return new Dictionary<CosmosContainerEnum, ContainerDetails>
            {
                { 
                    CosmosContainerEnum.ProblemsContainer, 
                    new ContainerDetails(config[ConfigurationConstants.LCProjectDatabaseNameKey], config[ConfigurationConstants.LCProjectContainerNameKey]) 
                }
            };
        }
    }
}
