using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Constants
{
    public static class ConfigurationConstants
    {
        #region Application Settings
        public const string CosmosDBUriKey = "ApplicationSettings:CosmosDbUri";
        public const string CosmosDBAccountKey = "ApplicationSettings:AccountKey";
        public const string ApplicationSettings = "ApplicationSettings";
        public const string LCProjectContainerNameKey = "LCProject:ContainerName";
        public const string LCProjectDatabaseNameKey = "LCProject:DatabaseName";
        #endregion
    }
}
