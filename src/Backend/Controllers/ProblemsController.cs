namespace Backend.Controllers
{
    using Backend.Models.Public;
    using Backend.Operations;
    using Microsoft.AspNetCore.Mvc;
    using ProblemPublicModel = Common.Models.Problem;

    [ApiController]
    public class ProblemsController : ControllerBase
    {
        private AppContext appContext;
        private readonly ILogger<ProblemsController> logger;
        private readonly IConfiguration configuration;
        public ProblemsController(AppContext appContext, ILogger<ProblemsController> logger, IConfiguration configuration)
        {
            this.appContext = appContext;
            this.logger = logger;
            this.configuration = configuration;
        }

        [HttpGet]
        [Route("problems")]
        public async Task<ActionResult<ProblemPublicModel>> GetProblems(
            [FromQuery(Name = QueryParam.Skip)] int skip = 0,
            [FromQuery(Name = QueryParam.Limit)] int limit = 50,
            [FromQuery(Name = QueryParam.Company)] List<string>? companies = null,
            [FromQuery(Name = QueryParam.Difficulty)] List<Common.Models.Difficulty>? difficulties = null,
            [FromQuery(Name = QueryParam.Tag)] List<string>? tags = null)
        {
            var filter = new ProblemFilter(skip, limit, companies, difficulties, tags);
            var filteredProblems = await appContext.dataProvider.GetProblemsAsync(filter);
            return Ok(filteredProblems);
        }

        [HttpGet]
        [Route("problems/{id}")]
        public async Task<ActionResult<ProblemPublicModel>> GetProblems(string id)
        {
            if (appContext.dataProvider.problemsCache.TryGetValue(id, out var problem))
            {
                return Ok(problem);
            }
            return NotFound($"Problem {id} not found.");
        }
    }
}