using Backend.Operations;
using Microsoft.Azure.Cosmos;

namespace Backend
{
    public class AppContext
    {
        public readonly Operations.DataProvider dataProvider;
        public readonly IConfiguration configuration;
        public readonly ILogger<DataProvider> logger;

        public AppContext(CosmosClient cosmosClient, IConfiguration configuration, ILogger<DataProvider> logger)
        {
            this.dataProvider = new Operations.DataProvider(cosmosClient, configuration, logger);
            this.configuration = configuration;
            this.logger = logger;
        }
    }
}