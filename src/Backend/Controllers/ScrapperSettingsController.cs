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
    [Route("api/jobs/scrappers")]
    public class ScrapperSettingsController : ControllerBase
    {
        private readonly JobScrapperSettingsManager _settingsManager;

        private readonly ILogger<JobSearchController> _logger;

        public ScrapperSettingsController(JobScrapperSettingsManager jobScrapperSettingsManager,
            ILogger<JobSearchController> logger)
        {
            _settingsManager = jobScrapperSettingsManager;
            _logger = logger;
        }

        [HttpGet]
        [Route("")]
        public async Task<ActionResult<List<JobScrapperSettings>>> GetAllJobScrappers()
        {
            // Placeholder implementation for getting all scrappers
            return Ok(await _settingsManager.GetAllSettings());
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<ActionResult<JobScrapperSettings>> UpdateJobScrapperSettings(string id, [FromBody] ScrapperSettings settings)
        {
            try
            {
                return Ok(await _settingsManager.CreateOrUpdateSettings(id, settings));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Route("add")]
        public async Task<ActionResult<JobScrapperSettings>> CreateNewJobScrapperSettings([FromBody] ScrapperSettings settings)
        {
            return BadRequest("Use PUT api/jobs/scrappers/{id} to create or update scrapper settings.");
            // return Ok(await _settingsManager.CreateOrUpdateSettings(string.Empty, settings));
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<ActionResult<JobScrapperSettings>> GetJobScrapperSettings(string id)
        {
            // Placeholder implementation for getting scrapper settings
            return Ok(await _settingsManager.GetSettingsById(id));
        }
    }
}
