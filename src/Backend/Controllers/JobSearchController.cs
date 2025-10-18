namespace Backend.Controllers
{
    using Backend.Operations;
    using Microsoft.AspNetCore.Mvc;
    using Common.Models;
    using Common.Models.Public;
    using Common.Repositories;
    using System.Threading.Tasks;

    [ApiController]
    [Route("api")]
    public class JobSearchController : ControllerBase
    {
        private readonly GSEngine gsEngine;
        private readonly AIEngine aiEngine;
        private readonly JobScrapperManager jobscrapperManager;
        private readonly JobsRepository jobsContainer;
        private readonly ILogger<JobSearchController> logger;
        public JobSearchController(GSEngine gsEngine, AIEngine aiEngine, JobsRepository jobsContainer, JobScrapperManager jobscrapperManager, ILogger<JobSearchController> logger)
        {
            this.gsEngine = gsEngine;
            this.aiEngine = aiEngine;
            this.logger = logger;
            this.jobscrapperManager = jobscrapperManager;
            this.jobsContainer = jobsContainer;
        }

        [HttpGet]
        [Route("jobs/search")]
        public async Task<ActionResult<List<ScrappedJob>>> SearchJobs(
            [FromQuery(Name = "q")] string query,
            [FromQuery(Name = "d")] int nPreviousDays)
        {
            var result = await this.gsEngine.SearchBasicQueryAsync(query, nPreviousDays);
            if (result != null)
            {
                var levels = await this.aiEngine.GetJobLevelAsync(result);
                foreach (var level in levels)
                {
                    var job = result.FirstOrDefault(j => j.id == level.Key);
                    if (job != null)
                    {
                        job.tags.Add(level.Value);
                    }
                }
                return Ok(result);
            }
            return StatusCode(500, "Error occurred while searching for jobs.");
        }

        [HttpGet]
        [Route("jobs/latest")]
        public async Task<ActionResult<string>> GetLatestJobsFromScrapper()
        {
            return Ok(await this.jobsContainer.GetAllLatestJobsAsync());
        }

        [HttpGet]
        [Route("jobs/profile/{id}")]
        public async Task<ActionResult<string>> GetJobById(string id)
        {
            var job = await this.jobsContainer.GetJobByIdAsync(id);
            if (job != null)
            {
                return Ok(job);
            }
            return Ok("Not found.");
        }

        [HttpGet]
        [Route("jobs/scrappers")]
        public ActionResult<List<ScrapperSettings>> GetAllJobScrappers()
        {
            // Placeholder implementation for getting all scrappers
            return Ok(this.jobscrapperManager.settingsManager.GetAllSettings());
        }

        [HttpPut]
        [Route("jobs/scrappers/{id}")]
        public ActionResult<ScrapperSettings> CreateOrUpdateJobScrapperSettings(string id, [FromBody] ScrapperSettings settings)
        {
            // Placeholder implementation for updating scrapper settings
            return Ok(this.jobscrapperManager.settingsManager.CreateOrUpdateSettings(id, settings));
        }

        [HttpGet]
        [Route("jobs/scrappers/{id}")]
        public ActionResult<ScrapperSettings> GetJobScrapperSettings(string id)
        {
            // Placeholder implementation for getting scrapper settings
            return Ok(this.jobscrapperManager.settingsManager.GetSettingsById(id));
        }

        [HttpGet]
        [Route("jobs/scrappers/{id}/trigger")]
        public ActionResult<ScrapperSettings> TriggerScrapper(string id)
        {
            // Placeholder implementation for getting scrapper settings
            this.jobscrapperManager.RunScrapperByIdAsync(id);
            return Ok($"Started scrapper for settings id: {id}");
        }
    }
}