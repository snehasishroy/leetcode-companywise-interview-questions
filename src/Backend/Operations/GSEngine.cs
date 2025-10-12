namespace Backend.Operations
{
    using System.Data.Common;
    using Backend.Models.Internal;
    using Microsoft.Azure.Cosmos.Linq;
    using Newtonsoft.Json;
    public class GSEngine
    {
        private readonly string apiKey;
        private readonly string searchEngineId;
        private readonly HttpClient httpClient;
        private string baseUrl = "https://customsearch.googleapis.com/customsearch/v1";
        private int maxResultsPerSearch = 150;
        ILogger<GSEngine> logger;

        public GSEngine(IConfiguration configuration, ILogger<GSEngine> _logger)
        {
            this.apiKey = configuration["GoogleSearch:ApiKey"] ?? throw new ArgumentNullException("Google Search API Key is not configured.");
            this.searchEngineId = configuration["GoogleSearch:SearchEngineId"] ?? throw new ArgumentNullException("Google Search Engine ID is not configured.");
            this.logger = _logger;
            this.httpClient = new HttpClient();
        }

        public async Task<List<ScrappedJob>> SearchAndScrapeJobsAsync(string query, int nPreviousDays = 1)
        {
            var allJobs = new List<ScrappedJob>();
            int startIndex = 1, totalResults = 0;

            var template = $"{this.baseUrl}?key={apiKey}&cx={searchEngineId}&q={Uri.EscapeDataString(query)}";
            template += AddLocationToQuery() + AddDateRestrictionToQuery($"d{nPreviousDays}") + AddNegativeTermToQuery() +
                AddPositiveTermToQuery() + AddAdditionalSearchTerms(); // + RemoveSiteSearchFromQuery()

            do
            {
                var url = template + AddStartIndexToQuery(startIndex);
                var res = await SearchRawUrlAsync(url);
                if (res == null)
                {
                    logger.LogError("SearchAsync returned null result.");
                    break;
                }
                else if (string.IsNullOrEmpty(res.queries.request[0].totalResults) || res.items == null)
                {
                    logger.LogInformation($"No results found for query: {url}");
                    break;
                }
    
                foreach (var item in res.items)
                {
                    var job = new ScrappedJob(item, DateTime.UtcNow);
                    allJobs.Add(job);
                }

                totalResults = int.Parse(res.queries.request[0].totalResults);
                startIndex += res.queries.request[0].count;            
            }
            while (startIndex < maxResultsPerSearch && startIndex < totalResults);

            this.logger.LogInformation($"Fetched {allJobs.Count} jobs. Total available: {totalResults}. Using url template: {template}");

            return allJobs;
        }

        public async Task<Models.Public.GSResult?> SearchRawUrlAsync(string url)
        {
            try
            {
                var response = await httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<Models.Public.GSResult>(content);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during Google Search API call.");
            }

            return null;
        }

        private string AddLocationToQuery(string location = "in")
        {
            return $"&gl={location}";
        }

        private string AddDateRestrictionToQuery(string dateRestrict = "d1")
        {
            return $"&dateRestrict={dateRestrict}";
        }

        private string AddNegativeTermToQuery(string phrase = "manager")
        {
            return $"&excludeTerms={Uri.EscapeDataString(phrase)}";
        }

        private string AddPositiveTermToQuery(string phrase = "Software Engineer")
        {
            return $"&exactTerms={Uri.EscapeDataString(phrase)}";
        }

        private string AddSiteSearchToQuery(string site = "linkedin.com")
        {
            return $"&siteSearch={site}&siteSearchFilter=i";
        }

        private string RemoveSiteSearchFromQuery(string site = "linkedin.com")
        {
            return $"&siteSearch={site}&siteSearchFilter=e";
        }

        private string AddSortingToQuery(string sort = "date")
        {
            return $"&sort={sort}";
        }

        private string AddAdditionalSearchTerms(string terms = "India")
        {
            return $"&hq={Uri.EscapeDataString(terms)}";
        }
        
        private string AddStartIndexToQuery(int startIndex = 1)
        {
            return $"&start={startIndex}";
        }
    }
}