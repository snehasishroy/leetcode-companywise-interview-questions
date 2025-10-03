namespace Backend.Operations
{
    using Common.Models;
    using Microsoft.Azure.Cosmos;

    public class DataProvider
    {
        private const int RefreshIntervalInHours = 6;
        private CosmosClient cosmosClient;
        private readonly IConfiguration configuration;
        ILogger<DataProvider> logger;
        private DateTime lastLoadedTime = DateTime.MinValue;
        public Dictionary<string, Problem> problemsCache { get;  private set; } = new Dictionary<string, Problem>(StringComparer.OrdinalIgnoreCase);

        public DataProvider(CosmosClient client, IConfiguration configuration, ILogger<DataProvider> logger)
        {
            this.cosmosClient = client;
            this.configuration = configuration;
            this.logger = logger;
        }

        public async Task<List<Problem>> GetProblemsAsync(IFilter? filter = null)
        {
            var allProblems = await GetAllProblemsAsync();
            if (filter != null)
            {
                return filter.ApplyFilterAsync(allProblems.Values.ToList());
            }
            return allProblems.Values.ToList();
        }

        private async Task<Dictionary<string, Problem>> GetAllProblemsAsync()
        {
            if ((DateTime.UtcNow - lastLoadedTime) > TimeSpan.FromHours(RefreshIntervalInHours))
            {
                await LoadLatestDataAsync();
            }
            return problemsCache;
        }

        private async Task LoadLatestDataAsync()
        {
            try
            {
                var dbId = configuration.GetValue<string>("ApplicationSettings:CosmosDbDatabaseId");
                var containerId = configuration.GetValue<string>("ApplicationSettings:CosmosDbContainerId");
                var db = cosmosClient.GetDatabase(dbId);
                var container = db.GetContainer(containerId);

                var query = "SELECT * FROM c";
                var queryDefinition = new QueryDefinition(query);
                var queryResultSetIterator = container.GetItemQueryIterator<ProblemSchema>(queryDefinition);

                List<Problem> results = new List<Problem>();
                while (queryResultSetIterator.HasMoreResults)
                {
                    var response = await queryResultSetIterator.ReadNextAsync();
                    results.AddRange(response.Select(item => new Problem(item)));
                }

                lastLoadedTime = DateTime.UtcNow;
                problemsCache = results.ToDictionary(p => p.id, StringComparer.OrdinalIgnoreCase);
                this.logger.LogInformation($"Loaded {problemsCache.Count} problems from Cosmos DB at {lastLoadedTime}");
            }
            catch (Exception ex)
            {
                this.logger.LogError($"Error loading data from Cosmos DB. {ex}");
            }
        }
    }
}