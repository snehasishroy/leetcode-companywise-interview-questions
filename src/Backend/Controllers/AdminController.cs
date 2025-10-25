
namespace Backend.Controllers
{
    using Backend.Operations;
    using Common.Managers;
    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly ILogger<AdminController> logger;
        private readonly ScrapperRunner scrapperRunner;

        public AdminController(ILogger<AdminController> logger, ScrapperRunner scrapperRunner)
        {
            this.logger = logger;
            this.scrapperRunner = scrapperRunner;
        }

        [HttpGet]
        [Route("scrappers/trigger/{scrapperId}")]
        public ActionResult<string> TriggerScrapperRun(string scrapperId)
        {
            // _ = Task.Run(async () => await scrapperRunner.RunScrapperAsync(scrapperId));
            return Ok($"[Dummy]: Scrapper run triggered for id: {scrapperId}");
        }

        [HttpPut]
        [Route("scrappers/trigger/{scrapperId}")]
        public ActionResult<string> EnableScrapper(string scrapperId)
        {
            this.scrapperRunner.EnableScrapper(scrapperId);
            return Ok($"Scrapper enabled for id: {scrapperId}");
        }

        [HttpDelete]
        [Route("scrappers/trigger/{scrapperId}")]
        public ActionResult<string> DisableScrapper(string scrapperId)
        {
            this.scrapperRunner.DisableScrapper(scrapperId);
            return Ok($"Scrapper disabled for id: {scrapperId}");
        }

        [HttpGet]
        [Route("scrappers/background/start")]
        public ActionResult<string> StartScrappersInBackground()
        {
            this.scrapperRunner.StartBackgroundRunner();
            return Ok($"Background scrapper runs started. Current State: {this.scrapperRunner.CurrentState}");
        }

        [HttpGet]
        [Route("scrappers/background/stop")]
        public ActionResult<string> StopScrappersInBackground()
        {
            this.scrapperRunner.StopBackgroundRunner();
            return Ok($"Background scrapper runs stopped. Current State: {this.scrapperRunner.CurrentState}");
        }

        [HttpGet]
        [Route("scrappers/background/status")]
        public ActionResult<string> GetScrappersInBackgroundStatus()
        {
            this.scrapperRunner.StopBackgroundRunner();
            return Ok($"{this.scrapperRunner.GetStatus()}");
        }
    }
}