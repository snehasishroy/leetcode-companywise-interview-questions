using Microsoft.Azure.Cosmos;
using Common.Models;
using Common.DatabaseModels;

namespace Synchronizer;

public class ProblemsProcessor
{
    private string rootDir;
    private CosmosClient cosmosClient;
    private DateTime ScrappedDate = new DateTime(2025, 11, 1);
    private Dictionary<string,string> TagsToReplace =
        new Dictionary<string, string> { { "more-than-six-months", "one-year" } };

    public ProblemsProcessor(string rootDir, CosmosClient client)
    {
        this.rootDir = rootDir;
        this.cosmosClient = client;
    }

    public async Task Run()
    {
        var files = Helper.GetCsvFileNames(rootDir);

        Dictionary<string, Problem> allProblems = new Dictionary<string, Problem>();
        HashSet<string> recentTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            var problems = Helper.ReadProblemsFromCsv(file, rootDir);
            foreach (var problem in problems)
            {
                var companyName = problem.metadata[TagName.FolderName];
                var recent = problem.metadata[TagName.FileName];
                if (TagsToReplace.Keys.Contains(recent, StringComparer.OrdinalIgnoreCase))
                {
                    recent = TagsToReplace[recent.ToLower()];
                }
                recentTags.Add(recent);
                problem.metadata.Clear();

                if (!allProblems.ContainsKey(problem.id))
                {
                    allProblems[problem.id] = new Problem(problem);
                    allProblems[problem.id].metadata["scrapped_date"] = ScrappedDate.ToString("yyyy-MM-dd");
                    if (!allProblems[problem.id].companies.ContainsKey(companyName))
                    {
                        allProblems[problem.id].companies[companyName] = new List<string>();
                    }
                    allProblems[problem.id].companies[companyName].Add(recent);
                }
                else
                {
                    if (!allProblems[problem.id].companies.ContainsKey(companyName))
                    {
                        allProblems[problem.id].companies[companyName] = new List<string>();
                    }
                    allProblems[problem.id].companies[companyName].Add(recent);
                }
            }

        }
        // Implementation for processing problems
        Console.WriteLine($"Total unique problems found: {allProblems.Count}");
        Console.WriteLine($"Recent tags found: {string.Join(", ", recentTags)}");

        /*
        // For printing the problems before inserting - validation
        var sampleProblems = allProblems.Values.Take(Math.Min(5, allProblems.Count)).ToList();
        foreach (var prob in sampleProblems) Console.WriteLine(prob.ToString());
        */

        var db = cosmosClient.GetDatabase(ComosDbSettings.DatabaseId);
        var container = db.GetContainer(ComosDbSettings.ContainerId);

        var problemsToUpsert = allProblems.Values.ToList();

        var batchSize = 50;
        for (int start = 0; start < problemsToUpsert.Count; start += batchSize)
        {
            var batch = problemsToUpsert.Skip(start).Take(batchSize).ToList();
            Console.WriteLine($"Upserting batch of {batch.Count} problems... | start: {start}");
            await UpsertProblems(container, batch);
            await Task.Delay(TimeSpan.FromSeconds(1)); // To avoid overwhelming the Cosmos DB with requests
        }

    }

    private async Task UpsertProblems(Container container, List<Problem> problems)
    {
        var tasks = new List<Task<ItemResponse<ProblemSchema>>>();
        var problemIds = new List<string>();
        foreach (var problem in problems)
        {
            try
            {
                problemIds.Add(problem.id);
                tasks.Add(container.UpsertItemAsync<ProblemSchema>(new ProblemSchema(problem)));
                await Task.Delay(TimeSpan.FromMilliseconds(10)); // To avoid overwhelming the Cosmos DB with requests
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error upserting problem {problem.id}: {ex.Message}");
            }
        }

        await Task.WhenAll(tasks);
        Console.WriteLine($"Upserted {tasks.Count} problems. {string.Join(", ", problemIds)}");
    }
}