namespace Backend;

using System.Data;
using Backend.Operations;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging.ApplicationInsights;

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
        var cosmosClient = new CosmosClient(config["ApplicationSettings:CosmosDbUri"], config["ApplicationSettings:CosmosDbPrimaryKey"]);
        builder.Services.AddSingleton<CosmosClient>(cosmosClient);
        builder.Services.AddSingleton<DataProvider>();
        builder.Services.AddSingleton<GSEngine>();
        builder.Services.AddSingleton<AIEngine>();
        builder.Services.AddSingleton<AppContext>();

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
