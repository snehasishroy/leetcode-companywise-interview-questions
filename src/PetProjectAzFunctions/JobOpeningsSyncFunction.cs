using System;
using Common.Managers;
using Common.Repositories;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace PetProjectAzFunctions
{
    public class JobOpeningsSyncFunction
    {
        private readonly ILogger _logger;

        private readonly JobScrapperSettingsRepository _jobScrapperSettingsRepository;

        private readonly IServiceProvider _serviceProvider;

        public JobOpeningsSyncFunction(ILoggerFactory loggerFactory, 
            JobScrapperSettingsRepository jobScrapperSettingsRepository,
            IServiceProvider serviceProvider)
        {
            _logger = loggerFactory.CreateLogger<JobOpeningsSyncFunction>();
            _jobScrapperSettingsRepository = jobScrapperSettingsRepository;
            _serviceProvider = serviceProvider;
        }

        [Function("JobOpeningsSyncFunction")]
        public async Task Run([TimerTrigger("%CronPeriod%")] TimerInfo myTimer)
        {
            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");
            var scrapperSettings = await _jobScrapperSettingsRepository.GetAllSettings();
            var currentTime = DateTime.UtcNow;
            await Parallel.ForEachAsync(scrapperSettings, async (setting, ct) =>
            {
                try
                {
                    if (setting.enabled)
                    {
                        if(setting.lastRunTime.AddMinutes(setting.runIntervalInMinutes) >= currentTime.AddMinutes(-1))
                        {
                            using var scope = _serviceProvider.CreateScope();
                            var scrapperInstance = scope.ServiceProvider.GetRequiredService<JobScrapper>();
                            scrapperInstance.ConfigureSettings(setting);
                            await scrapperInstance.RunAsync();
                            setting.lastRunTime = currentTime;
                            await _jobScrapperSettingsRepository.UpdateSettingsAsync(setting.id, setting);
                        }
                        else
                        {
                            _logger.LogInformation($"Scrapper setting {setting.id} was run at {setting.lastRunTime}, next run schedule has not yet come. Skipping this run.");
                        }
                    }
                    else
                    {
                        _logger.LogInformation($"Scrapper setting {setting.id} is disabled. Skipping.");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing scrapper settings: {setting}");
                }
            });
        }
    }
}
