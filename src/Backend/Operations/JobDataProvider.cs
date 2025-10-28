namespace Backend.Operations
{
    using System.ComponentModel;
    using Common.Cache;
    using Common.DatabaseModels;
    using Common.Queries;
    using Common.Repositories;
    
    public class JobDataProvider
    {
        private readonly ILogger<JobDataProvider> _logger;
        private readonly JobsRepository _jobsRepository;

        private TimeSpan cacheDuration = TimeSpan.FromMinutes(15);
        private Memca cache;

        public JobDataProvider(ILogger<JobDataProvider> logger, JobsRepository jobsRepository)
        {
            _logger = logger;
            _jobsRepository = jobsRepository;
            this.cache = new Memca(this.cacheDuration);
        }

        public async Task<List<ScrappedJob>> GetJobsAsync(string jobLocation, int lookbackdays, string level)
        {
            var filteredJobs = await GetRecentJobsAsync(jobLocation, lookbackdays);

            if (!string.IsNullOrEmpty(level))
            {
                filteredJobs = filteredJobs.Where(j => j.jobType.ToLower().Contains(level.ToLower())).ToList();
            }

            return filteredJobs;
        }

        public async Task<List<ScrappedJob>> GetJobsAsync(JobQuery jobquery)
        {
            return await this._jobsRepository.GetJobsFromQuery(jobquery);
        }
        
        public async Task<List<ScrappedJob>> GetAllJobsAsync(int lookbackdays = 1)
        {
            var allJobs = await GetAllLatestJobsAsync();
            allJobs = allJobs.Where(j => j.scrappedTime >= DateTime.UtcNow.AddDays(-lookbackdays)).ToList();
            return allJobs;
        }

        private async Task<List<ScrappedJob>> GetRecentJobsAsync(string location = "india", int lookbackdays = 3)
        {
            string cacheKey = $"jobs_{location}_{lookbackdays}";
            if (this.cache.Get<List<ScrappedJob>>(cacheKey) is List<ScrappedJob> cachedJobs)
            {
                _logger.LogInformation($"Cache hit for key: {cacheKey}");
                return cachedJobs;
            }

            _logger.LogInformation($"Cache miss for key: {cacheKey}. Fetching from database.");
            var jobs = await _jobsRepository.GetJobsAsync(location, lookbackdays);
            this.cache.Set(cacheKey, jobs, this.cacheDuration);
            return jobs;
        }

        private async Task<List<ScrappedJob>> GetAllLatestJobsAsync()
        {
            string cacheKey = $"all_jobs_latest";
            if (this.cache.Get<List<ScrappedJob>>(cacheKey) is List<ScrappedJob> cachedJobs)
            {
                _logger.LogInformation($"Cache hit for key: {cacheKey}");
                return cachedJobs;
            }

            _logger.LogInformation($"Cache miss for key: {cacheKey}. Fetching from database.");
            var jobs = await _jobsRepository.GetAllLatestJobsAsync();
            this.cache.Set(cacheKey, jobs, this.cacheDuration);
            return jobs;
        }
    }
}