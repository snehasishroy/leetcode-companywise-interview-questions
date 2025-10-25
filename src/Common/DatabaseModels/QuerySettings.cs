using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PublicSettingsModel = Common.Models.Public.QuerySettings;

namespace Common.DatabaseModels
{

    public class QuerySettings
    {
        public string query { get; set; }
        public List<string> locations { get; set; }
        public List<string> sitesToInclude { get; set; }
        public List<string> sitesToExclude { get; set; }
        public List<string> exactTerms { get; set; }
        public List<string> negativeTerms { get; set; }
        public int lookBackDays { get; set; } = 1;
        public List<string> additionalSearchterms { get; set; }

        public QuerySettings(PublicSettingsModel qs)
        {
            query = qs.query;
            locations = qs.locations;
            sitesToInclude = qs.sitesToInclude;
            sitesToExclude = qs.sitesToExclude;
            exactTerms = qs.exactTerms;
            negativeTerms = qs.negativeTerms;
            additionalSearchterms = qs.additionalTerms;
        }
    }
}
