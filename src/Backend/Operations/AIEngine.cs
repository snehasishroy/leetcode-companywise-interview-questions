namespace Backend.Operations
{
    using Azure;
    using Azure.AI;
    using Azure.Identity;
    using Azure.AI.Inference;
    using Azure.AI.Projects;
    using Azure.AI.Agents.Persistent;
    using System.Diagnostics;
    using Common.Models;
    using Newtonsoft.Json;

    public class AIEngine
    {
        private const string AI_SERVICE_ENDPOINT = "https://job-analyzer.services.ai.azure.com/api/projects/firstProject";
        private const string AGENT_ID = "asst_gWZPhAs5gg4jVvmuto9sop5h";
        private readonly ILogger<AIEngine> logger;
        private readonly IConfiguration configuration;
        private PersistentAgent agent;
        private PersistentAgentsClient agentsClient;
        public AIEngine(IConfiguration configuration, ILogger<AIEngine> logger)
        {
            this.logger = logger;
            this.configuration = configuration;
            for (int i = 0; i < 3; i++)
            {
                try
                {
                    this.agentsClient = new(AI_SERVICE_ENDPOINT, new DefaultAzureCredential());
                    this.agent = this.agentsClient.Administration.GetAgent(AGENT_ID);
                    this.logger.LogInformation($"AIEngine initialized successfully. Endpoint: {AI_SERVICE_ENDPOINT}, AgentId: {AGENT_ID}");
                    break;
                }
                catch (Exception ex)
                {
                    logger.LogError($"Error initializing AIEngine: {ex.Message}");
                    Task.Delay((i + 1) * 2000).ConfigureAwait(false).GetAwaiter().GetResult();
                }
            }

            if (!IsReady())
            {
                this.logger.LogError("AIEngine failed to initialize properly.");
                throw new InvalidOperationException("AIEngine failed to initialize properly.");
            }
        }

        public bool IsReady()
        {
            return this.agent != null && this.agentsClient != null;
        }
        
        public async Task<List<KeyValuePair<string, string>>> GetJobLevelAsync(List<ScrappedJob> scrappedJobs)
        {
            var results = new List<KeyValuePair<string, string>>();
            this.logger.LogInformation($"Processing {scrappedJobs.Count} scrapped jobs. Ready: {IsReady()}");
            for (int i=0; i < scrappedJobs.Count; i += 20)
            {
                var batch = scrappedJobs.Skip(i).Take(20).ToList();
                try
                {
                    var sw = Stopwatch.StartNew();
                    var prompt = JsonConvert.SerializeObject(batch);
                    var response = await GetResponseInternalAsync(prompt);
                    sw.Stop();
                    this.logger.LogInformation($"Processed jobs: {string.Join(",", batch.Select(j => j.jobId))} | response: {response}");
                    var kvList = response.Split(",").Select(kvs => kvs.Split(":")).Where(kv => kv.Length == 2).Select(kv => new KeyValuePair<string, string>(kv[0].Trim(), kv[1].Trim())).ToList();
                    results.AddRange(kvList);
                }
                catch (Exception ex)
                {
                    this.logger.LogError($"Error processing batch: {string.Join(",", batch.Select(j => j.jobId))}  | {ex.Message}");
                }
            }
            return results;
        }

        private async Task<string> GetResponseInternalAsync(string input)
        {
            if (!IsReady())
            {
                this.logger.LogError($"AIEngine is not properly initialized. Given input: {input}");
                throw new InvalidOperationException("AIEngine is not properly initialized.");
            }

            PersistentAgentThread thread = agentsClient.Threads.CreateThread();
            
            PersistentThreadMessage messageResponse = agentsClient.Messages.CreateMessage(
                thread.Id,
                MessageRole.User,
                input);

            ThreadRun run = agentsClient.Runs.CreateRun(
                thread.Id,
                agent.Id);

            // Poll until the run reaches a terminal status
            do
            {
                await Task.Delay(TimeSpan.FromMilliseconds(500));
                run = agentsClient.Runs.GetRun(thread.Id, run.Id);
            }
            while (run.Status == RunStatus.Queued
                || run.Status == RunStatus.InProgress);
            if (run.Status != RunStatus.Completed)
            {
                this.logger.LogError($"Run failed or was canceled. ThreadId: {thread.Id} Last error: {run.LastError?.Message}");
                throw new InvalidOperationException($"Run failed or was canceled: {run.LastError?.Message}");
            }

            Pageable<PersistentThreadMessage> messages = agentsClient.Messages.GetMessages(
                thread.Id, order: ListSortOrder.Ascending);

            string response = string.Empty;
            PersistentThreadMessage lastThreadMessage = messages.Last();

            foreach (MessageContent contentItem in lastThreadMessage.ContentItems)
            {
                if (contentItem is MessageTextContent textItem)
                {
                    response += textItem.Text;
                }
            }

            agentsClient.Threads.DeleteThread(thread.Id);
            return response;
        }
    }    
}