namespace Backend.Operations
{
    using Backend.Filters;
    using Common;
    using Common.Cache;
    using Common.Constants;
    using Common.Models;

    public class DataProvider
    {
        private ICache _problemCache;
        private ILogger<DataProvider> _logger;
        private List<string> companyTags = new List<string>();
        private DateTime lastMetadataFetchTime = DateTime.MinValue;
        public DataProvider([FromKeyedServices(CacheConstants.ProblemCacheKey)] ICache problemCache, ILogger<DataProvider> logger)
        {
            _problemCache = problemCache;
            _logger = logger;
        }

        public async Task<List<string>> GetProblemsMetadataAsync()
        {
            if (companyTags == null || companyTags.Count == 0 || lastMetadataFetchTime < DateTime.UtcNow.AddDays(14))
            {
                var allProblems =  await GetAllProblemsAsync();
                var companySet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var problem in allProblems.Values)
                {
                    if (problem.companies != null)
                    {
                        foreach (var company in problem.companies)
                        {
                            companySet.Add(company.Key);
                        }
                    }
                }
                lastMetadataFetchTime = DateTime.UtcNow;
                companyTags = companySet?.ToList() ?? new List<string>();
            }

            return companyTags;
        }

        public async Task<List<Problem>> GetProblemsAsync(IFilter<Problem>? filter = null)
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