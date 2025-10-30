using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Models.Miscellaneous
{
    public class ContainerDetails
    {
        public string DatabaseName { get; set; }
        public string ContainerName { get; set; }

        public ContainerDetails(string databaseName, string containerName)
        {
            DatabaseName = databaseName;
            ContainerName = containerName;
        }
    }
}
