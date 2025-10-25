namespace Common.Managers

{
    using Common.DatabaseModels;
    using Common.Engines;
    using Common.Repositories;
    using Microsoft.Extensions.Logging;

    public class JobScrapper
    {
        private JobScrapperSettings settings;
        private GSEngine gsEngine;
        private AIEngine aiEngine;
        private JobsRepository jobsRepository;
        private ILogger logger;

        public JobScrapper(GSEngine gsEngine, AIEngine aiEngine, JobsRepository jobsRepo, ILogger logger)
        {
            this.logger = logger;
            this.gsEngine = gsEngine;
            this.aiEngine = aiEngine;
            this.jobsRepository = jobsRepo;
        }

        public void ConfigureSettings(JobScrapperSettings settings)
        {
            this.settings = settings;
        }

        public async Task RunAsync()
        {
            var startTime = DateTime.UtcNow;
            this.logger.LogInformation($"Starting JobScrapper run for settings: {this.settings}");

            var searchResults = await gsEngine.SearchQueryAsync(this.settings);

            if (searchResults == null || searchResults.Count == 0)
            {
                this.logger.LogInformation($"Nothing to process. Query settings: {this.settings}");
                return;
            }

            var mp = new Dictionary<string, ScrappedJob>(StringComparer.OrdinalIgnoreCase);
            foreach (var job in searchResults)
            {
                if (!mp.ContainsKey(job.id))
                {
                    mp[job.id] = job;
                }
            }
            
            var levels = await this.aiEngine.GetJobLevelAsync(searchResults);
            foreach (var level in levels)
            {
                if (mp.ContainsKey(level.Key))
                {
                    mp[level.Key].tags.AddRange(level.Value.Split("-"));
                }
                else
                {
                    this.logger.LogWarning($"Job ID {level.Key} not found in search results while assigning level tag.");
                }
            }

            foreach (var job in searchResults)
            {
                var success = await this.jobsRepository.CreateIfNotExistsAsync(job);
                if (!success)
                {
                    this.logger.LogError($"Failed to push job {job.id} to JobsRepository.");
                }
            }

            var duration = DateTime.UtcNow - startTime;
            this.logger.LogInformation($"JobScrapper run completed. Duration: {duration}. Processed {searchResults.Count} jobs for settings: {this.settings}");
        }

    }
}