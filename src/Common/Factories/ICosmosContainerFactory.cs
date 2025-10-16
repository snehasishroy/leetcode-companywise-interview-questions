using Common.Enums;
using Microsoft.Azure.Cosmos;

namespace Common.Factories
{
    public interface ICosmosContainerFactory
    {
        Container GetContainer(CosmosContainerEnum container);
    }
}