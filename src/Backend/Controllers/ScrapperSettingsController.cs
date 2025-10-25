using Common.DatabaseModels;
using Common.Engines;
using Common.Managers;
using Common.Models;
using Common.Models.Public;
using Common.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScrapperSettingsController : ControllerBase
    {
        private readonly JobScrapperSettingsManager _settingsManager;

        private readonly ILogger<JobSearchController> _logger;

        public ScrapperSettingsController( JobScrapperSettingsManager jobScrapperSettingsManager,
            ILogger<JobSearchController> logger)
        {
            _settingsManager = jobScrapperSettingsManager;
            _logger = logger;
        }

        [HttpGet]
        [Route("jobs/scrappers")]
        public async Task<ActionResult<List<JobScrapperSettings>>> GetAllJobScrappers()
        {
            // Placeholder implementation for getting all scrappers
            return Ok(await _settingsManager.GetAllSettings());
        }

        [HttpPut]
        [Route("jobs/scrappers/{id}")]
        public async Task<ActionResult<JobScrapperSettings>> UpdateJobScrapperSettings(string id, [FromBody] ScrapperSettings settings)
        {
            // Placeholder implementation for updating scrapper settings
            return Ok(await _settingsManager.CreateOrUpdateSettings(id, settings));
        }

        [HttpPost]
        [Route("jobs/scrappers/Add")]
        public async Task<ActionResult<JobScrapperSettings>> CreateNewJobScrapperSettings([FromBody] ScrapperSettings settings)
        {
            // Placeholder implementation for updating scrapper settings
            return Ok(await _settingsManager.CreateOrUpdateSettings(string.Empty, settings));
        }

        [HttpGet]
        [Route("jobs/scrappers/{id}")]
        public async Task<ActionResult<JobScrapperSettings>> GetJobScrapperSettings(string id)
        {
            // Placeholder implementation for getting scrapper settings
            return Ok(await _settingsManager.GetSettingsById(id));
        }
    }
}
