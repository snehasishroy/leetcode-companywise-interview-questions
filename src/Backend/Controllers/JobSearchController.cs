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
        private readonly JobsRepository jobsRepository;
        private readonly ILogger<JobSearchController> logger;
        public JobSearchController(JobsRepository jobsRepository, ILogger<JobSearchController> logger)
        {
            this.logger = logger;
            this.jobsRepository = jobsRepository;
        }

        [HttpPost]
        [Route("search")]
        public async Task<ActionResult<List<ScrappedJob>>> SearchJobs([FromBody] JobQuery jobquery)
        {
            return Ok(await jobsRepository.GetJobsFromQuery(jobquery));
        }

        [HttpGet]
        [Route("latest")]
        public async Task<ActionResult<string>> GetLatestJobsFromDb(
            [FromQuery] string location = "India",
            [FromQuery] string level = "Mid")
        {
            return Content(JobListView.RenderScrappedJobsHtml(await this.jobsRepository.GetJobsEasyQueryAsync(location, level)), "text/html");
        }

        [HttpGet]
        [Route("lastOneDay")]
        public async Task<ActionResult<string>> GetLastOneDayJobsFromDb()
        {
            return Ok(await this.jobsRepository.GetAllJobsInLastOneDay());
        }

        [HttpGet]
        [Route("profile/{id}")]
        public async Task<ActionResult<string>> GetJobById(string id)
        {
            var job = await this.jobsRepository.GetJobByIdAsync(id);
            if (job != null)
            {
                return Ok(job);
            }
            return Ok("Not found.");
        }
    }
}