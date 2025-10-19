namespace Common.Queries
{
    public class JobQuery
    {
        public string JobType { get; set; }    // Software Engineer, Data Scientist, etc.
        public DateTime StartDate { get; set; } = DateTime.UtcNow;  // Start date for the job posting
        public DateTime EndDate { get; set; } = DateTime.UtcNow;   // End date for the job posting
        public List<string> Companies { get; set; } // List of companies to filter
        public List<string> Locations { get; set; } // List of locations to filter
        public string JobLevel { get; set; } // Entry Level, Mid Level, Senior Level, etc.
    }
}
