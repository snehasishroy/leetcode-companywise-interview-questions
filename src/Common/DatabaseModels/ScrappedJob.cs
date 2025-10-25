using Common.Models;

namespace Common.DatabaseModels
{
    public class ScrappedJob
    {
        public string id { get; set; }
        public string title { get; set; }
        public string displayLink { get; set; }
        public string snippet { get; set; }
        public string description { get; set; }
        public string link { get; set; }
        public DateTime scrappedTime { get; set; }
        public DateTime JobPostedTime { get; set; }
        public string companyName { get; set; }
        public string jobType { get; set; }
        public string location { get; set; }
        public List<string> tags { get; set; } = new List<string>();

        public ScrappedJob() { }
        public ScrappedJob(Item item, DateTime scrappedTime)
        {
            title = item.title;
            displayLink = item.displayLink;
            snippet = item.snippet;
            link = item.link;
            id = GenerateHashId(item.link, item.title, item.displayLink);
            this.scrappedTime = scrappedTime;
            description = "NA";
        }

        private string GenerateHashId(string v1, string v2, string v3)
        {
            return Helper.FastHashId.GenerateHashId(v1, v2, v3);
        }
    }
}