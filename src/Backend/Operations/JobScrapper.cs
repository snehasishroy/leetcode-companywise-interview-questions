namespace Backend.Operations
{
    using Common.Models;
    using Common.Repositories;

    public class JobScrapper
    {
        private JobScrapperSettings settings;
        private GSEngine gsEngine;
        private AIEngine aiEngine;
        private JobsRepository jobsContainer;
        private ILogger logger;

        public JobScrapper(JobScrapperSettings settings, GSEngine gsEngine, AIEngine aiEngine, JobsRepository jobsRepo, ILogger logger)
        {
            this.logger = logger;
            this.gsEngine = gsEngine;
            this.aiEngine = aiEngine;
            this.settings = settings;
            this.jobsContainer = jobsRepo;
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

            var mp = searchResults.ToDictionary(j => j.id, j => j);
            var levels = await this.aiEngine.GetJobLevelAsync(searchResults);
            foreach (var level in levels)
            {
                if (mp.ContainsKey(level.Key))
                {
                    mp[level.Key].tags.Add(level.Value);
                }
                else
                {
                    this.logger.LogWarning($"Job ID {level.Key} not found in search results while assigning level tag.");
                }
            }

            foreach (var job in searchResults)
            {
                var success = await this.jobsContainer.CreateOrUpdateJobAsync(job);
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