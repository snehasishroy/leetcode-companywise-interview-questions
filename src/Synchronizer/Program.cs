namespace Synchronizer;

using Microsoft.Azure.Cosmos;
using ProblemSchema = Common.Models.Problem;

internal class Program
{
    private static bool SetupDb(CosmosClient client)
    {
        try
        {
            client.CreateDatabaseIfNotExistsAsync(ComosDbSettings.DatabaseId).GetAwaiter().GetResult();
            var db = client.GetDatabase(ComosDbSettings.DatabaseId);
            db.CreateContainerIfNotExistsAsync(ComosDbSettings.ContainerId, partitionKeyPath: "/id").GetAwaiter().GetResult();
            var container = db.GetContainer(ComosDbSettings.ContainerId);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            return false;
        }
        return true;
    }

    static void Test(CosmosClient client)
    {
        var db = client.GetDatabase(ComosDbSettings.DatabaseId);
        var container = db.GetContainer(ComosDbSettings.ContainerId);

        var res = container.UpsertItemAsync<ProblemSchema>(new ProblemSchema
        {
            id = "1",
            title = "Two Sum",
            url = "https://leetcode.com/problems/two-sum/",
            difficulty = Common.Models.Difficulty.Easy,
            companies = new Dictionary<string, List<string>> { {"Google", new List<string>{"6-month"}} },
            acceptance = 78.5,
            metadata = new Dictionary<string, string>
            {
                { "tag", "array" },
                { "frequency", "high" }
            }
        }).GetAwaiter().GetResult();

        var res2 = container.UpsertItemAsync<ProblemSchema>(new ProblemSchema
        {
            id = "2",
            title = "Three Sum",
            url = "https://leetcode.com/problems/two-sum/",
            difficulty = Common.Models.Difficulty.Easy,
            companies = new Dictionary<string, List<string>> { {"Meta", new List<string>{"3-month"}} },
            metadata = new Dictionary<string, string>
            {
                { "tag", "array" },
                { "frequency", "high" }
            }
        }).GetAwaiter().GetResult();
    }

    public static void Main(string[] args)
    {
        Console.WriteLine("Hello, World!");

        string rootDir = args.Length > 0 ? args[0] : throw new ArgumentException("Root directory argument is required");
        string primaryKey = args.Length > 1 ? args[1] : throw new ArgumentException("Primary key of cosmos db is required");

        CosmosClient client = new CosmosClient(ComosDbSettings.Uri, primaryKey);

        SetupDb(client);
        // Test(client);

        var processor = new ProblemsProcessor(rootDir, client);
        processor.Run().GetAwaiter().GetResult();

        Console.WriteLine("Bye bye");
    }
}

public class ComosDbSettings
{
    public static string Uri { get; } = "https://lcw-cosmos.documents.azure.com:443/";
    public static string DatabaseId { get; } = "LeetCodeWrapper";
    public static string ContainerId { get; } = "Problems";
    public static string PrimaryKey { get; } = ""; // Get this from command line args
}
