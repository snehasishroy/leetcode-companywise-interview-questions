namespace Common.Models
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
        public List<string> tags { get; set; } = new List<string>();

        public ScrappedJob() { }
        public ScrappedJob(Item item, DateTime scrappedTime)
        {
            this.title = item.title;
            this.displayLink = item.displayLink;
            this.snippet = item.snippet;
            this.link = item.link;
            this.id = GenerateHashId(item.link, item.title, item.displayLink);
            this.scrappedTime = scrappedTime;
            this.description = "NA";
        }

        private string GenerateHashId(string v1, string v2, string v3)
        {
            return Common.Helper.FastHashId.GenerateHashId(v1, v2, v3);
        }
    }
}