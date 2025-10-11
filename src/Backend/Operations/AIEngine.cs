namespace Backend.Operations
{
    using Azure.Identity;
    using Azure.AI.Inference;
    using Azure.Core;
    using Azure.Core.Pipeline;
    class AIEngine
    {
        private const string OPENAI_API_URL = "https://job-analyzer.services.ai.azure.com/api/projects/firstProject";
        private readonly ILogger<AIEngine> logger;
        private readonly IConfiguration configuration;
        public AIEngine(IConfiguration configuration, ILogger<AIEngine> logger)
        {            
        }
    }    
}