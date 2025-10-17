namespace Common.Models
{
    public class ScrappedJob
    {
        public string jobId { get; set; }
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
            this.jobId = GenerateHashId(item.link, item.displayLink);
            this.scrappedTime = scrappedTime;
            this.description = "NA";
        }

        private string GenerateHashId(string url, string displayLink)
        {
            // Use a simple hash code and base36 encoding for lightweight hash
            int hash = url.GetHashCode();
            string base36 = Math.Abs(hash).ToString("x"); // Hexadecimal representation
            string dtime = DateTime.UtcNow.ToString("yyyyMMdd");
            // Pad or trim to 20 characters
            var hashvalue = base36.Length > 10 ? base36.Substring(0, 10) : base36.PadLeft(10, '0');
            return $"{displayLink}-{dtime}-{hashvalue}";
        }
    }
}