using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace Common.Cache
{
    public abstract class BaseCache : ICache
    {
        // Internal cache storage
        protected readonly ConcurrentDictionary<string, CacheItem> _cache = new();

        // Represents a cache item with optional expiration
        protected class CacheItem
        {
            public object? Value { get; set; }
            public DateTime? Expiration { get; set; }
        }

        public T? Get<T>(string key)
        {
            if (_cache.TryGetValue(key, out var item))
            {
                if (item.Expiration == null || item.Expiration > DateTime.UtcNow)
                {
                    return item.Value is T value ? value : default;
                }
                // Item expired, remove it
                _cache.TryRemove(key, out _);
            }
            return default;
        }

        public void Set<T>(string key, T value, TimeSpan? absoluteExpiration = null)
        {
            var expiration = absoluteExpiration.HasValue
                ? DateTime.UtcNow.Add(absoluteExpiration.Value)
                : (DateTime?)null;

            _cache[key] = new CacheItem
            {
                Value = value,
                Expiration = expiration
            };
        }

        public void Remove(string key)
        {
            _cache.TryRemove(key, out _);
        }

        public bool Contains(string key)
        {
            if (_cache.TryGetValue(key, out var item))
            {
                if (item.Expiration == null || item.Expiration > DateTime.UtcNow)
                {
                    return true;
                }
                // Item expired, remove it
                _cache.TryRemove(key, out _);
            }
            return false;
        }

        /// <summary>
        /// Populates the cache using a custom technique.
        /// Override this method in derived classes for custom population logic.
        /// </summary>
        public abstract Task Populate();
    }
}