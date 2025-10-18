namespace Backend;

using Backend.Operations;
using Common.Cache;
using Common.Constants;
using Common.Factories;
using Common.Repositories;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging.ApplicationInsights;
using System.Data;

public class Program
{
    private static void SetupLogging(ILoggingBuilder logging, IConfiguration configuration)
    {
        logging.ClearProviders();
        logging.AddApplicationInsights(
            configureTelemetryConfiguration: (config) => config.ConnectionString = configuration["ApplicationInsights:ConnectionString"],
            configureApplicationInsightsLoggerOptions: (options) => { }
        );

        var appLogLevelSettings = configuration.GetSection("ApplicationInsights");
        var defaultLogLevel = appLogLevelSettings.GetValue("LogLevel:Default", LogLevel.Information);
        Console.WriteLine($"Setting log level for Default to {defaultLogLevel}");

        logging.AddFilter<ApplicationInsightsLoggerProvider>("", defaultLogLevel);

        foreach (var kvp in appLogLevelSettings.GetSection("LogLevel").AsEnumerable())
        {
            if (Enum.TryParse<LogLevel>(kvp.Value, out var logLevel))
            {
                logging.AddFilter<ApplicationInsightsLoggerProvider>(kvp.Key.Split(":").Last(), logLevel);
            }
        }
    }

    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var services = builder.Services;

        // Add services to the container.
        builder.Services.AddApplicationInsightsTelemetry();
        builder.Services.AddControllers();
        
        // Add CORS
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowReactApp",
                builder => builder
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader());
        });
        
        SetupLogging(builder.Logging, builder.Configuration);

        if (builder.Environment.IsDevelopment())
        {
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Logging.AddConsole();
        }

        // Register AppContext as singleton
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

        #region Register Cache
        services.AddKeyedSingleton<ICache, ProblemCache>(CacheConstants.ProblemCacheKey);
        #endregion

        #region Register Repositories
        services.AddTransient<IProblemRepository, ProblemRepository>();
        #endregion

        #region Register Miscellaneous Services
        services.AddTransient<DataProvider>();
        #endregion

        services.AddSingleton<GSEngine>();
        services.AddSingleton<AIEngine>();
        services.AddSingleton<JobsRepository>();
        services.AddSingleton<JobScrapperSettingsManager>();
        services.AddSingleton<JobScrapperManager>();

        var app = builder.Build();
        ILogger logger = app.Logger;

        logger.LogInformation($"Backend started at {DateTime.UtcNow}");

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Commenting out HTTPS redirection to allow HTTP
        // app.UseHttpsRedirection();

        // Use CORS before other middleware
        app.UseCors("AllowReactApp");

        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}
