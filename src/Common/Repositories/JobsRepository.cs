namespace Common.Repositories
{
    using Common.DatabaseModels;
    using Common.Enums;
    using Common.Factories;
    using Common.Queries;
    using Microsoft.Azure.Cosmos;
    using Microsoft.Extensions.Logging;
    using System.Net;

    public class JobsRepository
    {
        private readonly Container jobsContainer;
        private readonly ILogger<JobsRepository> logger;

        public JobsRepository(ICosmosContainerFactory cosmosContainerFactory,
            ILogger<JobsRepository> logger)
        {
            this.jobsContainer = cosmosContainerFactory.GetContainer(CosmosContainerEnum.JobsContainer);
            this.logger = logger;
        }

        public async Task<List<ScrappedJob>> GetAllLatestJobsAsync()
        {
            var query = "SELECT * FROM c ORDER BY c.scrappedTime DESC OFFSET 0 LIMIT 100";
            return await QueryJobsAsync(query);
        }

        public async Task<List<ScrappedJob>> GetAllJobsInLastOneDay()
        {
            var query = $"SELECT * FROM c WHERE DateTimeToTimestamp(GetCurrentTimestamp()) - DateTimeToTimestamp(c.scrappedTime) < 86400";
            return await QueryJobsAsync(query);
        }

        public async Task<ScrappedJob> GetJobByIdAsync(string id)
        {
            try
            {
                // TODO: NOT working as expected
                var response = await this.jobsContainer.ReadItemAsync<ScrappedJob>(id, new PartitionKey(id));
                return response.Resource;
            }
            catch (CosmosException cosmosEx) when (cosmosEx.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                this.logger.LogWarning($"Job: {id} not found in container.");
                return null;
            }
            catch (Exception ex)
            {
                this.logger.LogError($"Failed to retrieve job: {id} from container. Ex: {ex}");
                return null;
            }
        }

        /// <summary>
        /// Create the item only if it does not already exist using a single DB call.
        /// Returns true if the item was created, false if it already existed.
        /// </summary>
        public async Task<bool> CreateIfNotExistsAsync(ScrappedJob job)
        {
            if (job == null) throw new ArgumentNullException(nameof(job));
            try
            {
                var requestOptions = new ItemRequestOptions
                {
                    // Instruct Cosmos to only create if the item does not exist.
                    // SDK will translate this to an If-None-Match header.
                    IfNoneMatchEtag = "*"
                };

                var response = await this.jobsContainer.CreateItemAsync(job, new PartitionKey(job.id), requestOptions);
                // Created successfully
                this.logger.LogInformation("Created job {id} in Cosmos DB. RU charge: {ru}", job.id, response.RequestCharge);
                return true;
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.PreconditionFailed || ex.StatusCode == HttpStatusCode.Conflict)
            {
                // Item already exists (server enforces the If-None-Match precondition).
                this.logger.LogInformation("Job {id} already exists. Skipping create.", job.id);
                return false;
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Failed to create job {id} in Cosmos DB.", job.id);
                throw;
            }
        }

        public async Task<List<ScrappedJob>> GetJobsEasyQueryAsync(string location, string level)
        {
            var query = "SELECT * FROM c WHERE EXISTS ( SELECT VALUE t FROM t IN c.tags WHERE CONTAINS(LOWER(t), @location) OR CONTAINS(LOWER(t), @unknown) ) ORDER BY c.scrappedTime DESC OFFSET 0 LIMIT 1000";
            var queryDefinition = new QueryDefinition(query).WithParameter("@location", location.ToLower()).WithParameter("@unknown", "unknown");
            var res = await QueryJobsAsync(queryDefinition);
            res = res.Where(j => j.tags.Any(t => t.Equals(level, StringComparison.OrdinalIgnoreCase))).ToList();
            return res;
        }


        private async Task<List<ScrappedJob>> QueryJobsAsync(string query)
        {
            var queryDefinition = new QueryDefinition(query);
            var queryResultSetIterator = jobsContainer.GetItemQueryIterator<ScrappedJob>(queryDefinition);
            List<ScrappedJob> results = new List<ScrappedJob>();
            while (queryResultSetIterator.HasMoreResults)
            {
                var response = await queryResultSetIterator.ReadNextAsync();
                results.AddRange(response);
            }
            this.logger.LogInformation($"Retrieved {results.Count} jobs from Cosmos DB. Query: {query}");
            return results;
        }
        private async Task<List<ScrappedJob>> QueryJobsAsync(QueryDefinition queryDefinition)
        {
            var queryResultSetIterator = jobsContainer.GetItemQueryIterator<ScrappedJob>(queryDefinition);
            List<ScrappedJob> results = new List<ScrappedJob>();
            while (queryResultSetIterator.HasMoreResults)
            {
                var response = await queryResultSetIterator.ReadNextAsync();
                results.AddRange(response);
            }
            this.logger.LogInformation($"Retrieved {results.Count} jobs from Cosmos DB.");
            return results;
        }

        public async Task<List<ScrappedJob>> GetJobsFromQuery(JobQuery jobquery)
        {
            if (jobquery == null) throw new ArgumentNullException(nameof(jobquery));

            var sql = "SELECT * FROM c WHERE 1=1";
            var qd = new QueryDefinition(sql);

            // JobType: search title or tags
            if (!string.IsNullOrWhiteSpace(jobquery.JobType))
            {
                qd = qd.WithParameter("@jobType", jobquery.JobType);
                sql += " AND CONTAINS(c.jobType, @jobType, true)";
            }

            // Companies (list)
            if (jobquery.Companies != null && jobquery.Companies.Count > 0)
            {
                var companyConditions = new List<string>();
                for (int i = 0; i < jobquery.Companies.Count; i++)
                {
                    var param = $"@company{i}";
                    qd = qd.WithParameter(param, jobquery.Companies[i]);
                    companyConditions.Add($"c.companyName = {param}");
                }
                sql += " AND (" + string.Join(" OR ", companyConditions) + ")";
            }

            // Locations: fallback to searching in displayLink, snippet or description
            if (jobquery.Locations != null && jobquery.Locations.Count > 0)
            {
                var locationConditions = new List<string>();
                for (int i = 0; i < jobquery.Locations.Count; i++)
                {
                    var param = $"@location{i}";
                    qd = qd.WithParameter(param, jobquery.Locations[i]);
                    locationConditions.Add($"CONTAINS(c.location, {param}, true)");
                }
                sql += " AND (" + string.Join(" OR ", locationConditions) + ")";
            }

            // JobLevel: search in tags array (case-insensitive contains)
            if (!string.IsNullOrWhiteSpace(jobquery.JobLevel))
            {
                qd = qd.WithParameter("@jobLevel", jobquery.JobLevel);
                // Use EXISTS with an IN on the tags array and CONTAINS for case-insensitive matching
                sql += " AND EXISTS(SELECT VALUE t FROM t IN c.tags WHERE CONTAINS(t, @jobLevel, true))";
            }

            // Date range (JobPostedTime)
            if (jobquery.StartDate > DateTime.MinValue)
            {
                qd = qd.WithParameter("@startDate", jobquery.StartDate);
                sql += " AND c.jobPostedTime >= @startDate";
            }
            if (jobquery.EndDate > DateTime.MinValue)
            {
                qd = qd.WithParameter("@endDate", jobquery.EndDate);
                sql += " AND c.jobPostedTime <= @endDate";
            }

            // final ordering / limit - optional, keep callers responsible if needed
            qd = new QueryDefinition(sql); // rebuild with final SQL
            // re-add parameters (QueryDefinition is immutable-like with chaining, but to keep it simple rebuild)
            // Add parameters again
            if (!string.IsNullOrWhiteSpace(jobquery.JobType)) qd = qd.WithParameter("@jobType", jobquery.JobType);
            if (jobquery.Companies != null)
            {
                for (int i = 0; i < jobquery.Companies.Count; i++) qd = qd.WithParameter($"@company{i}", jobquery.Companies[i]);
            }
            if (jobquery.Locations != null)
            {
                for (int i = 0; i < jobquery.Locations.Count; i++) qd = qd.WithParameter($"@location{i}", jobquery.Locations[i]);
            }
            if (!string.IsNullOrWhiteSpace(jobquery.JobLevel)) qd = qd.WithParameter("@jobLevel", jobquery.JobLevel);
            if (jobquery.StartDate > DateTime.MinValue) qd = qd.WithParameter("@startDate", jobquery.StartDate);
            if (jobquery.EndDate > DateTime.MinValue) qd = qd.WithParameter("@endDate", jobquery.EndDate);

            logger.LogInformation($"Constructed job query: {sql}");

            return await QueryJobsAsync(qd);
        }
    }
}
