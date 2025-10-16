namespace Backend.Controllers
{
    using Backend.Filters;
    using Backend.Models.Public;
    using Backend.Operations;
    using Common.Models;
    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api")]
    public class ProblemsController : ControllerBase
    {
        private readonly ILogger<ProblemsController> logger;
        private readonly IConfiguration configuration;
        private readonly DataProvider dataProvider;
        public ProblemsController(ILogger<ProblemsController> logger,
            DataProvider dataProvider,
            IConfiguration configuration)
        {
            this.logger = logger;
            this.dataProvider = dataProvider;
            this.configuration = configuration;
        }

        [HttpGet]
        [Route("")]
        public ActionResult<string> GetHome()
        {
            return Ok("Leetcode Wrapper Backend is running.");
        }

        [HttpGet]
        [Route("problems")]
        public async Task<ActionResult<IEnumerable<Problem>>> GetProblems(
            [FromQuery(Name = QueryParam.Skip)] int skip = 0,
            [FromQuery(Name = QueryParam.Limit)] int limit = 50,
            [FromQuery(Name = QueryParam.Company)] List<string>? companies = null,
            [FromQuery(Name = QueryParam.Difficulty)] List<Difficulty>? difficulties = null,
            [FromQuery(Name = QueryParam.Tag)] List<string>? tags = null)
        {
            var filter = new ProblemFilter(skip, limit, companies, difficulties, tags);
            var filteredProblems = await dataProvider.GetProblemsAsync(filter);
            return Ok(filteredProblems);
        }

        [HttpGet]
        [Route("problems/{id}")]
        public async Task<ActionResult<Problem>> GetProblems(string id)
        {
            var problem = await dataProvider.GetProblemByIdAsync(id);
            if (problem != null)
            {
                return Ok(problem);
            }
            return NotFound($"Problem {id} not found.");
        }
    }
}