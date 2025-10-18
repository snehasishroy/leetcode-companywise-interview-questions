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
            string dbId;
            string containerId;
            switch (container)
            {
                case CosmosContainerEnum.ProblemsContainer:
                    dbId = containerDetails[container].DatabaseName;
                    containerId = containerDetails[container].ContainerName;
                    break;
                case CosmosContainerEnum.JobsContainer:
                    dbId = "JobDataBase";
                    containerId = "JobDetailsContainer";
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(container), container, null);
            }
            
            var db = _cosmosClient.GetDatabase(dbId);
            return db.GetContainer(containerId);
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
