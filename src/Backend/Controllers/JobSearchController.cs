namespace Backend.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api")]
    public class JobSearchController : ControllerBase
    {
        private readonly AppContext appContext;
        public JobSearchController(AppContext appContext)
        {
            this.appContext = appContext;
        }

        [HttpGet]
        [Route("/jobs/search")]
        public async Task<ActionResult<List<Models.Internal.ScrappedJob>>> SearchJobs(
            [FromQuery(Name = "q")] string query,
            [FromQuery(Name = "d")] int nPreviousDays)
        {
            var gsEngine = this.appContext.gsEngine;
            var result = await gsEngine.SearchAndScrapeJobsAsync(query, nPreviousDays);
            if (result != null)
            {
                var levels = await this.appContext.aiEngine.GetJobLevelAsync(result);
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