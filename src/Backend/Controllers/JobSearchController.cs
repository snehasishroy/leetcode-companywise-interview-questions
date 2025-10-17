namespace Backend.Controllers
{
    using Backend.Operations;
    using Microsoft.AspNetCore.Mvc;
    using Common.Models;

    [ApiController]
    [Route("api")]
    public class JobSearchController : ControllerBase
    {
        private readonly GSEngine gsEngine;
        private readonly AIEngine aiEngine;
        private readonly ILogger<JobSearchController> logger;
        public JobSearchController(GSEngine gsEngine, AIEngine aiEngine, ILogger<JobSearchController> logger)
        {
            this.gsEngine = gsEngine;
            this.aiEngine = aiEngine;
            this.logger = logger;
        }

        [HttpGet]
        [Route("/jobs/search")]
        public async Task<ActionResult<List<ScrappedJob>>> SearchJobs(
            [FromQuery(Name = "q")] string query,
            [FromQuery(Name = "d")] int nPreviousDays)
        {
            var result = await this.gsEngine.SearchAndScrapeJobsAsync(query, nPreviousDays);
            if (result != null)
            {
                var levels = await this.aiEngine.GetJobLevelAsync(result);
                foreach (var level in levels)
                {
                    var job = result.FirstOrDefault(j => j.jobId == level.Key);
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
        [Route("/jobs")]
        public ActionResult<string> GetLatestJobs()
        {
            // Placeholder implementation for latest jobs
            return Ok("Latest job postings");
        }

        [HttpGet]
        [Route("/jobs/{id}")]
        public ActionResult<string> GetJobById(string id)
        {
            // Placeholder implementation for getting job by ID
            return Ok($"Job details for ID: {id}");
        }

    }
}