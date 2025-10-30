using System.Collections.Concurrent;
using System.Dynamic;
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
        private Task? backgroundTask = null;
        public string CurrentState => backgroundTask != null && !backgroundTask.IsCompleted ? "Running" : "Stopped";

        private string LastError = string.Empty;
        private DateTime lastRunTime = DateTime.MinValue;
        private ConcurrentDictionary<string, string> lastRunResults = new ConcurrentDictionary<string, string>();

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
                this.lastRunResults[scrapperId] = $"[{DateTime.Now}] Settings not found.";
                return;
            }

            try
            {
                var scrapper = new JobScrapper(gsEngine, aiEngine, jobsRepository, logger);
                scrapper.ConfigureSettings(settings);
                var res = await scrapper.RunAsync();
                logger.LogInformation($"Scrapper run completed for id: {scrapperId} | Results: {res}");
                settings.lastRunTime = DateTime.UtcNow;
                this.lastRunResults[scrapperId] = $"[{DateTime.Now}] {res}";
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
            }
        }

        public void StopBackgroundRunner()
        {
            if (cts != null && !cts.IsCancellationRequested)
            {
                cts.Cancel();
            }
        }

        public dynamic GetStatus()
        {            
            dynamic status = new ExpandoObject();
            var dict = (IDictionary<string, object>)status;

            dict["CurrentState"] = this.CurrentState;
            dict["AIEngineReady"] = this.aiEngine?.IsReady() ?? false;
            dict["RunInterval"] = this.runInterval;
            dict["LastRunTimeUtc"] = this.lastRunTime;
            dict["EnabledScrappers"] = this.enabledScrappers.ToArray();
            // copy concurrent dictionary to a normal dictionary for safe enumeration / serialization
            dict["LastResults"] = this.lastRunResults.ToDictionary(kv => kv.Key, kv => kv.Value);
            dict["LastError"] = this.LastError;

            return status;
        }

        private async Task RunInBackgroundAsync(CancellationToken cancellationToken)
        {
            TimeSpan checkInterval = TimeSpan.FromMinutes(5);
            while (!cancellationToken.IsCancellationRequested)
            {
                if (DateTime.UtcNow - lastRunTime > runInterval)
                {
                    foreach (var scrapperId in enabledScrappers)
                    {
                        logger.LogInformation($"Starting scrapper run for id: {scrapperId}");
                        await RunScrapperAsync(scrapperId);
                    }
                    lastRunTime = DateTime.UtcNow;
                }
                await Task.Delay(checkInterval, cancellationToken);
            }
        }
    }
}