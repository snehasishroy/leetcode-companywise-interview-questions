using Common.Enums;
using Common.Factories;
using Common.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;

namespace Common.Repositories
{
    public class ProblemRepository : IProblemRepository
    {
        private readonly Container _problemContainer;
        private readonly ILogger<ProblemRepository> _logger;

        public ProblemRepository(ICosmosContainerFactory cosmosContainerFactory,
            ILogger<ProblemRepository> logger)
        {
            _problemContainer = cosmosContainerFactory.GetContainer(CosmosContainerEnum.ProblemsContainer);
            _logger = logger;
        }

        public async Task<List<Problem>> GetAllProblemsAsync()
        {
            var query = "SELECT * FROM c";
            var queryDefinition = new QueryDefinition(query);
            var queryResultSetIterator = _problemContainer.GetItemQueryIterator<ProblemSchema>(queryDefinition);
            List<Problem> results = new List<Problem>();
            while (queryResultSetIterator.HasMoreResults)
            {
                var response = await queryResultSetIterator.ReadNextAsync();
                results.AddRange(response.Select(item => new Problem(item)));
            }
            results = results.OrderBy(p => int.TryParse(p.id, out int id) ? id : -1).ToList();
            _logger.LogInformation($"Retrieved {results.Count} problems from Cosmos DB.");
            return results;
        }
    }
}
