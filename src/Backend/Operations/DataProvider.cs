namespace Backend.Operations
{
    using Backend.Filters;
    using Common.Cache;
    using Common.Constants;
    using Common.Models;

    public class DataProvider
    {
        private ICache _problemCache;
        private ILogger<DataProvider> _logger;
        public DataProvider([FromKeyedServices(CacheConstants.ProblemCacheKey)] ICache problemCache, ILogger<DataProvider> logger)
        {
            _problemCache = problemCache;
            _logger = logger;
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
        
        public async Task<Problem?> GetProblemByIdAsync(string id)
        {
            var allProblems = await GetAllProblemsAsync();
            if (allProblems.TryGetValue(id, out var problem))
            {
                return problem;
            }
            return null;
        }

        private async Task<Dictionary<string, Problem>> GetAllProblemsAsync()
        {
            if (_problemCache.Contains(CacheConstants.ProblemCacheKey))
            {
                _logger.LogInformation("Problem cache hit. Retrieving data from cache.");
            }
            else
            {
                _logger.LogInformation("Problem cache miss. Loading data into cache.");
                await _problemCache.Populate();
            }
            
            return _problemCache.Get<Dictionary<string, Problem>>(CacheConstants.ProblemCacheKey) ?? new Dictionary<string, Problem>(StringComparer.OrdinalIgnoreCase);
        }
    }
}