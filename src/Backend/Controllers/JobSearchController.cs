namespace Backend.Controllers
{
    using Backend.Operations;
    using Microsoft.AspNetCore.Mvc;
    using Common.Models.Public;
    using Common.Repositories;
    using System.Threading.Tasks;
    using Common.Managers;
    using Common.Engines;
    using Common.Queries;
    using Common.DatabaseModels;

    [ApiController]
    [Route("api/jobs")]
    public class JobSearchController : ControllerBase
    {
        private readonly JobDataProvider jobDataProvider;
        private readonly ILogger<JobSearchController> logger;
        public JobSearchController(JobDataProvider jobDataProvider, ILogger<JobSearchController> logger)
        {
            this.logger = logger;
            this.jobDataProvider = jobDataProvider;
        }

        [HttpPost]
        [Route("search")]
        public async Task<ActionResult<List<ScrappedJob>>> SearchJobs([FromBody] JobQuery jobquery)
        {
            return await this.jobDataProvider.GetJobsAsync(jobquery);
        }

        [HttpGet]
        [Route("latest")]
        public async Task<ActionResult<string>> GetLatestJobsFromDb(
            [FromQuery] string location = "India",
            [FromQuery] string level = "Mid",
            [FromQuery] int days = 3)
        {
            var jobList = await this.jobDataProvider.GetJobsAsync(location, days, level);
            return Content(JobListView.RenderScrappedJobsHtml(jobList), "text/html");
        }

        [HttpGet]
        [Route("lastOneDay")]
        public async Task<ActionResult<string>> GetLastOneDayJobsFromDb()
        {
            return Ok(await this.jobDataProvider.GetAllJobsAsync(1));
        }
    }
}