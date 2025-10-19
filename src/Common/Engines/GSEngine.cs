using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Common.DatabaseModels;
using Common.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Common.Engines
{
    public class GSEngine
    {
        private readonly string apiKey;
        private readonly string searchEngineId;
        private readonly HttpClient httpClient;
        private string baseUrl = "https://customsearch.googleapis.com/customsearch/v1";
        private int maxResultsPerSearch = 150;
        private readonly ILogger<GSEngine> logger;

        public GSEngine(IConfiguration configuration, ILogger<GSEngine> _logger)
        {
            this.apiKey = configuration["GoogleSearch:ApiKey"] ?? throw new ArgumentNullException("Google Search API Key is not configured.");
            this.searchEngineId = configuration["GoogleSearch:SearchEngineId"] ?? throw new ArgumentNullException("Google Search Engine ID is not configured.");
            this.logger = _logger;
            this.httpClient = new HttpClient();
        }

        public async Task<List<ScrappedJob>> SearchQueryAsync(JobScrapperSettings settings)
        {
            if (settings == null) throw new ArgumentNullException(nameof(settings));

            var qsettings = settings.GetQuerySettings() ?? throw new InvalidOperationException("Query settings cannot be null.");
            var allJobs = new List<ScrappedJob>();
            int startIndex = 1;
            int totalResults = 0;

            var sb = new StringBuilder();
            sb.Append($"{this.baseUrl}?key={apiKey}&cx={searchEngineId}");

            // base query
            var baseQuery = qsettings.query ?? string.Empty;
            sb.Append($"&q={Uri.EscapeDataString(baseQuery)}");

            // date restriction
            if (qsettings.lookBackDays > 0)
            {
                sb.Append(AddDateRestrictionToQuery(qsettings.lookBackDays));
            }

            // Exact terms (join list if provided)
            if (qsettings.exactTerms != null && qsettings.exactTerms.Any())
            {
                var exact = string.Join(" ", qsettings.exactTerms.Where(s => !string.IsNullOrWhiteSpace(s)));
                if (!string.IsNullOrWhiteSpace(exact)) sb.Append(AddExactTermsToQuery(exact));
            }

            // Negative terms
            if (qsettings.negativeTerms != null && qsettings.negativeTerms.Any())
            {
                var neg = string.Join(" ", qsettings.negativeTerms.Where(s => !string.IsNullOrWhiteSpace(s)));
                if (!string.IsNullOrWhiteSpace(neg)) sb.Append(AddNegativeTermToQuery(neg));
            }

            // Location - use first location if present (api uses gl for country)
            if (qsettings.locations != null && qsettings.locations.Any() && !string.IsNullOrWhiteSpace(qsettings.locations.First()))
            {
                sb.Append(AddClientLocationToQuery(qsettings.locations.First()));
            }

            // Site include / exclude - use first for siteSearch (API supports one siteSearch parameter)
            if (qsettings.sitesToInclude != null && qsettings.sitesToInclude.Any() && !string.IsNullOrWhiteSpace(qsettings.sitesToInclude.First()))
            {
                sb.Append(AddSiteSearchToQuery(qsettings.sitesToInclude.First()));
            }
            else if (qsettings.sitesToExclude != null && qsettings.sitesToExclude.Any() && !string.IsNullOrWhiteSpace(qsettings.sitesToExclude.First()))
            {
                // prefer include if present; otherwise exclude
                sb.Append(AddExcludeSiteSearchFromQuery(qsettings.sitesToExclude.First()));
            }

            // Additional terms (hq)
            if (qsettings.additionalSearchterms != null && qsettings.additionalSearchterms.Any())
            {
                var add = string.Join(" ", qsettings.additionalSearchterms.Where(s => !string.IsNullOrWhiteSpace(s)));
                if (!string.IsNullOrWhiteSpace(add)) sb.Append(AddadditionalSearchterms(add));
            }

            var template = sb.ToString();

            do
            {
                var url = template + AddStartIndexToQuery(startIndex);
                var res = await SearchRawUrlAsync(url);
                if (res == null)
                {
                    logger.LogError("SearchRawUrlAsync returned null for url: {url}", url);
                    break;
                }

                // No items => stop
                if (res.items == null || res.items.Count == 0)
                {
                    logger.LogInformation("No items returned for url: {url}", url);
                    break;
                }

                foreach (var item in res.items)
                {
                    try
                    {
                        var job = new ScrappedJob(item, DateTime.UtcNow);
                        allJobs.Add(job);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Skipping item due to processing error.");
                    }
                }

                // Determine total results
                if (!string.IsNullOrWhiteSpace(res.searchInformation?.totalResults))
                {
                    if (!int.TryParse(res.searchInformation.totalResults, out totalResults))
                    {
                        // try fallback to queries.request[0].totalResults
                        var reqTotal = res.queries?.request?.FirstOrDefault()?.totalResults;
                        if (!int.TryParse(reqTotal, out totalResults)) totalResults = int.MaxValue;
                    }
                }
                else
                {
                    var reqTotal = res.queries?.request?.FirstOrDefault()?.totalResults;
                    if (!int.TryParse(reqTotal, out totalResults)) totalResults = int.MaxValue;
                }

                // Advance to next page if present
                if (res.queries?.nextPage != null && res.queries.nextPage.Count > 0)
                {
                    var next = res.queries.nextPage[0];
                    // Use next.startIndex if present; otherwise increment by count
                    if (next.startIndex > 0)
                    {
                        startIndex = next.startIndex;
                    }
                    else
                    {
                        var count = res.queries.request?.FirstOrDefault()?.count ?? res.items.Count;
                        if (count <= 0) break;
                        startIndex += count;
                    }
                }
                else
                {
                    // no next page -> stop
                    break;
                }

                // safety: prevent infinite looping
                if (startIndex <= 0 || startIndex > maxResultsPerSearch) break;
            }
            while (startIndex <= maxResultsPerSearch && (totalResults == 0 || startIndex <= totalResults));

            this.logger.LogInformation("Fetched {count} jobs. Total available (approx): {total}. Url template: {template}", allJobs.Count, totalResults, template);
            return allJobs;
        }

        public async Task<GSResult?> SearchRawUrlAsync(string url)
        {
            try
            {
                var response = await httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Google Search API returned status {status} for url {url}", response.StatusCode, url);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<GSResult>(content);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during Google Search API call.");
            }

            return null;
        }

        private string AddClientLocationToQuery(string location = "in")
        {
            return $"&gl={Uri.EscapeDataString(location)}";
        }

        private string AddDateRestrictionToQuery(int previousNDays = 1)
        {
            return $"&dateRestrict=d{previousNDays}";
        }

        private string AddNegativeTermToQuery(string phrase = "manager")
        {
            return $"&excludeTerms={Uri.EscapeDataString(phrase)}";
        }

        private string AddExactTermsToQuery(string phrase = "Software Engineer")
        {
            return $"&exactTerms={Uri.EscapeDataString(phrase)}";
        }

        private string AddSiteSearchToQuery(string site = "linkedin.com")
        {
            return $"&siteSearch={Uri.EscapeDataString(site)}&siteSearchFilter=i";
        }

        private string AddExcludeSiteSearchFromQuery(string site = "linkedin.com")
        {
            return $"&siteSearch={Uri.EscapeDataString(site)}&siteSearchFilter=e";
        }

        private string AddSortingToQuery(string sort = "date")
        {
            return $"&sort={Uri.EscapeDataString(sort)}";
        }

        private string AddadditionalSearchterms(string terms = "India")
        {
            return $"&hq={Uri.EscapeDataString(terms)}";
        }

        private string AddStartIndexToQuery(int startIndex = 1)
        {
            return $"&start={startIndex}";
        }
    }
}