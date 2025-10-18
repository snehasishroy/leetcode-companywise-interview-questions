namespace Common.Repositories
{
    using Common.Enums;
    using Common.Factories;
    using Common.Models;
    using Microsoft.Azure.Cosmos;
    using Microsoft.Extensions.Logging;

    public class JobsRepository
    {
        private readonly Container jobsContainer;
        private readonly ILogger<JobsRepository> logger;

        public JobsRepository(ICosmosContainerFactory cosmosContainerFactory,
            ILogger<JobsRepository> logger)
        {
            this.jobsContainer = cosmosContainerFactory.GetContainer(CosmosContainerEnum.JobsContainer);
            this.logger = logger;
        }

        public async Task<List<ScrappedJob>> GetAllLatestJobsAsync()
        {
            var query = "SELECT * FROM c ORDER BY c.scrappedTime DESC OFFSET 0 LIMIT 100";
            return await QueryJobsAsync(query);
        }

        public async Task<List<ScrappedJob>> GetAllJobsInLastOneDay()
        {
            var query = $"SELECT * FROM c WHERE DateTimeToTimestamp(GetCurrentTimestamp()) - DateTimeToTimestamp(c.scrappedTime) < 86400";
            return await QueryJobsAsync(query);
        }

        public async Task<ScrappedJob> GetJobByIdAsync(string id)
        {
            try
            {
                // TODO: NOT working as expected
                var response = await this.jobsContainer.ReadItemAsync<ScrappedJob>(id, new PartitionKey(id));
                return response.Resource;
            }
            catch (CosmosException cosmosEx) when (cosmosEx.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                this.logger.LogWarning($"Job: {id} not found in container.");
                return null;
            }
            catch (Exception ex)
            {
                this.logger.LogError($"Failed to retrieve job: {id} from container. Ex: {ex}");
                return null;
            }
        }

        public async Task<bool> CreateOrUpdateJobAsync(ScrappedJob job)
        {
            try
            {
                // TODO: Do async inserts for faster performance
                var res = await this.jobsContainer.UpsertItemAsync<ScrappedJob>(job);
            }
            catch (Exception ex)
            {
                this.logger.LogError($"Failed to push job: {job.id} to container. Ex: {ex}");
                return false;
            }

            return true;
        }

        private async Task<List<ScrappedJob>> QueryJobsAsync(string query)
        {
            var queryDefinition = new QueryDefinition(query);
            var queryResultSetIterator = jobsContainer.GetItemQueryIterator<ScrappedJob>(queryDefinition);
            List<ScrappedJob> results = new List<ScrappedJob>();
            while (queryResultSetIterator.HasMoreResults)
            {
                var response = await queryResultSetIterator.ReadNextAsync();
                results.AddRange(response);
            }
            this.logger.LogInformation($"Retrieved {results.Count} jobs from Cosmos DB. Query: {query}");
            return results;
        }
    }
}
