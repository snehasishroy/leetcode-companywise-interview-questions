namespace Common.Cache
{
    using System.Runtime.Caching;
    public class Memca
    {
        private MemoryCache cache;
        private readonly TimeSpan defaultExpiryDuration;

        public Memca(TimeSpan defaultExpiryDuration)
        {
            this.cache = MemoryCache.Default;
            this.defaultExpiryDuration = defaultExpiryDuration;
        }

        public T? Get<T>(string key)
        {
            return (T?)this.cache.Get(key);
        }

        public void Set<T>(string key, T value, TimeSpan? absoluteExpiration = null)
        {
            var policy = new CacheItemPolicy();
            if (absoluteExpiration.HasValue)
            {
                policy.AbsoluteExpiration = DateTimeOffset.Now.Add(absoluteExpiration.Value);
            }
            else
            {
                policy.AbsoluteExpiration = DateTimeOffset.Now.Add(this.defaultExpiryDuration);
            }
            this.cache.Set(key, value, policy);
        }

        public void Remove(string key)
        {
            this.cache.Remove(key);
        }
    }    
}
