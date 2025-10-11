using Backend.Operations;
using Microsoft.Azure.Cosmos;

namespace Backend
{
    public class AppContext
    {
        public readonly DataProvider dataProvider;
        public readonly IConfiguration configuration;
        public readonly ILogger<AppContext> logger;
        public readonly GSEngine gsEngine;
        public readonly AIEngine aiEngine;

        public AppContext(DataProvider _dataProvider, GSEngine _gsEngine, AIEngine _aiEngine, IConfiguration configuration, ILogger<AppContext> logger)
        {
            this.dataProvider = _dataProvider;
            this.gsEngine = _gsEngine;
            this.configuration = configuration;
            this.logger = logger;
            this.aiEngine = _aiEngine;
        }
    }
}