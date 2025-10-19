using Common.Constants;
using Common.Engines;
using Common.Factories;
using Common.Managers;
using Common.Repositories;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Data;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = FunctionsApplication.CreateBuilder(args);

        builder.ConfigureFunctionsWebApplication();
        ConfigureServices(builder);
        builder.Build().Run();
    }

    private static void ConfigureServices(FunctionsApplicationBuilder builder)
    {
        var services = builder.Services;
        // Register your services here
        services.AddLogging();
        services.AddHttpClient();
        services.AddTransient<AIEngine>();
        services.AddTransient<GSEngine>();
        services.AddTransient<JobScrapperSettingsRepository>();
        services.AddTransient<JobsRepository>();
        services.AddTransient<JobScrapper>();

        var config = builder.Configuration;

        #region Register Cosmos related services
        services.AddSingleton<CosmosClient>(s =>
        {
            var cosmosDbUri = config[ConfigurationConstants.CosmosDBUriKey];
            var cosmosDbAccountKey = config[ConfigurationConstants.CosmosDBAccountKey];
            if (string.IsNullOrEmpty(cosmosDbUri) || string.IsNullOrEmpty(cosmosDbAccountKey))
            {
                throw new DataException("Cosmos DB configuration is missing or invalid.");
            }
            return new CosmosClient(cosmosDbUri, cosmosDbAccountKey);
        });

        services.AddTransient<ICosmosContainerFactory, CosmosContainerFactory>();
        #endregion

    }
}
