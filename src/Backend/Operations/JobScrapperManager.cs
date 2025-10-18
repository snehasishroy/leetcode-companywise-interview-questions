using Common.Repositories;

namespace Backend.Operations
{
    public class JobScrapperManager
    {
        private readonly ILogger<JobScrapperManager> logger;
        private readonly GSEngine gsEngine;
        private readonly AIEngine aiEngine;
        private readonly JobsRepository jobsContainer;
        public readonly JobScrapperSettingsManager settingsManager;


        public JobScrapperManager(ILogger<JobScrapperManager> logger, GSEngine gsEngine, AIEngine aiEngine, JobScrapperSettingsManager settingsManager, JobsRepository jobsRepo)
        {
            this.logger = logger;
            this.gsEngine = gsEngine;
            this.aiEngine = aiEngine;
            this.settingsManager = settingsManager;
            this.jobsContainer = jobsRepo;
        }

        public async Task RunAllScrappersAsync()
        {

        }
        
        public async Task RunScrapperByIdAsync(string id)
        {
            var settings = this.settingsManager.GetSettingsById(id);
            if (settings.Enabled)
            {
                var scrapper = new JobScrapper(settings, this.gsEngine, this.aiEngine, this.jobsContainer, this.logger);
                Task.Run(async () =>
                {
                    try
                    {
                        await scrapper.RunAsync();
                    }
                    catch (Exception ex)
                    {
                        this.logger.LogError($"Error occurred while running scrapper with ID {id}: {ex.Message}");
                    } 
                });
                this.settingsManager.UpdateLastRunTime(id, DateTime.UtcNow);
            }
            else
            {
                this.logger.LogWarning($"Scrapper with ID {id} is disabled. Skipping execution.");
            }
        }
    }
}