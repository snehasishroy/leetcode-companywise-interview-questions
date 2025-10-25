using System.Collections.Concurrent;
using System.Text;
using Common.Engines;
using Common.Managers;
using Common.Repositories;

namespace Backend.Operations
{
    public class ScrapperRunner
    {
        ILogger<ScrapperRunner> logger;
        GSEngine gsEngine;
        AIEngine aiEngine;
        JobsRepository jobsRepository;
        JobScrapperSettingsManager settingsManager;

        private ConcurrentBag<string> enabledScrappers = new ConcurrentBag<string>();
        private TimeSpan runInterval = TimeSpan.FromHours(3);
        private CancellationTokenSource cts = new CancellationTokenSource();
        private Task backgroundTask = null;
        public string CurrentState { get; private set; } = "Stopped";
        private string LastError = string.Empty;
        private DateTime lastRunTime = DateTime.MinValue;

        public ScrapperRunner(ILogger<ScrapperRunner> logger, JobScrapperSettingsManager settingsManager, GSEngine gSEngine, AIEngine aIEngine, JobsRepository jobsRepository)
        {
            this.logger = logger;
            this.gsEngine = gSEngine;
            this.aiEngine = aIEngine;
            this.jobsRepository = jobsRepository;
            this.settingsManager = settingsManager;
        }

        public void EnableScrapper(string scrapperId)
        {
            if (!enabledScrappers.Contains(scrapperId))
            {
                enabledScrappers.Add(scrapperId);
            }
        }

        public void DisableScrapper(string scrapperId)
        {
            enabledScrappers = new ConcurrentBag<string>(enabledScrappers.Except(new List<string> { scrapperId }));
        }


        public async Task RunScrapperAsync(string scrapperId)
        {
            var settings = await this.settingsManager.GetSettingsById(scrapperId);
            if (settings == null)
            {
                logger.LogWarning($"Scrapper settings not found for id: {scrapperId}. Skipping scrapper run.");
                return;
            }

            try
            {
                var scrapper = new JobScrapper(gsEngine, aiEngine, jobsRepository, logger);
                scrapper.ConfigureSettings(settings);
                await scrapper.RunAsync();
                logger.LogInformation($"Scrapper run completed for id: {scrapperId}");
                settings.lastRunTime = DateTime.UtcNow;
                await this.settingsManager.UpdateSettingsAsync(scrapperId, settings);
            }
            catch (Exception ex)
            {
                logger.LogError($"Error running scrapper for id: {scrapperId}. Exception: {ex}");
                this.LastError = ex.Message;
            }
        }

        public void StartBackgroundRunner()
        {
            if (backgroundTask == null || backgroundTask.IsCompleted)
            {
                cts = new CancellationTokenSource();
                backgroundTask = RunInBackgroundAsync(cts.Token);
                this.CurrentState = "Running";
            }
        }

        public void StopBackgroundRunner()
        {
            if (cts != null && !cts.IsCancellationRequested)
            {
                cts.Cancel();
                this.CurrentState = "Stopped";
            }
        }

        public string GetStatus()
        {
            var sb = new StringBuilder();
            sb.Append($"CurrentState: {this.CurrentState}\n");
            sb.Append($"AI Engine Ready: {this.aiEngine.IsReady()}\n");
            sb.Append($"Run Interval: {this.runInterval} | Last Run Time (UTC): {this.lastRunTime}\n");
            sb.Append($"EnabledScrappers: {string.Join(",", this.enabledScrappers)}\n");
            sb.Append($"LastError: {this.LastError}");
            return sb.ToString();
        }

        private async Task RunInBackgroundAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                lastRunTime = DateTime.UtcNow;
                foreach (var scrapperId in enabledScrappers)
                {
                    logger.LogInformation($"Starting scrapper run for id: {scrapperId}");
                    await RunScrapperAsync(scrapperId);
                }
                await Task.Delay(runInterval, cancellationToken);
            }
        }
    }
}