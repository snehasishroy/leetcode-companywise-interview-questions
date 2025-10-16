
using Common.Constants;
using Common.Models;
using Common.Repositories;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Common.Cache
{
    public class ProblemCache : BaseCache
    {
        private const int RefreshIntervalInHours = 3;
        private readonly IConfiguration configuration;
        private readonly IProblemRepository problemRepository;
        ILogger<ProblemCache> logger;
        private DateTime lastLoadedTime = DateTime.MinValue;
        private Dictionary<string, Problem> problemsCache = new Dictionary<string, Problem>(StringComparer.OrdinalIgnoreCase);

        public ProblemCache(IProblemRepository problemRepository, IConfiguration configuration, ILogger<ProblemCache> logger) 
        {
            this.problemRepository = problemRepository;
            this.configuration = configuration;
            this.logger = logger;
            Task.Run(() => this.StartBackgroundRefreshAsync(CancellationToken.None));
        }

        public async override Task Populate()
        {
            await LoadLatestDataAsync();
            // Ideally we should just make a call to redi here and return the data.
            Set<Dictionary<string, Problem>>(CacheConstants.ProblemCacheKey, problemsCache);
            return;
        }


        private async Task LoadLatestDataAsync()
        {
            int maxRetries = 3;
            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    var results = await problemRepository.GetAllProblemsAsync();
                    lastLoadedTime = DateTime.UtcNow;
                    results = results.OrderBy(p => int.TryParse(p.id, out int id) ? id : -1).ToList();
                    problemsCache = results.ToDictionary(p => p.id, StringComparer.OrdinalIgnoreCase);
                    this.logger.LogInformation($"Loaded {problemsCache.Count} problems from Cosmos DB at {lastLoadedTime}");
                    break;
                }
                catch (Exception ex)
                {
                    this.logger.LogError($"Error loading data from Cosmos DB. {ex}");
                    await Task.Delay(TimeSpan.FromSeconds(2 * (i + 1)));
                }
            }
        }

        private async Task StartBackgroundRefreshAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    await LoadLatestDataAsync();
                }
                catch (Exception ex)
                {
                    this.logger.LogError($"Error during background data refresh: {ex}");
                }

                await Task.Delay(TimeSpan.FromHours(RefreshIntervalInHours), cancellationToken);
            }
        }

    }
}
