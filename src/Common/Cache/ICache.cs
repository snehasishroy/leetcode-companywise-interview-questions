using System;

namespace Common.Cache
{
    public interface ICache
    {
        /// <summary>
        /// Gets a cached item by key.
        /// </summary>
        /// <typeparam name="T">Type of the cached item.</typeparam>
        /// <param name="key">The cache key.</param>
        /// <returns>The cached item, or default if not found.</returns>
        T? Get<T>(string key);

        /// <summary>
        /// Adds or updates an item in the cache.
        /// </summary>
        /// <typeparam name="T">Type of the item.</typeparam>
        /// <param name="key">The cache key.</param>
        /// <param name="value">The value to cache.</param>
        /// <param name="absoluteExpiration">Optional absolute expiration time.</param>
        void Set<T>(string key, T value, TimeSpan? absoluteExpiration = null);

        /// <summary>
        /// Removes an item from the cache.
        /// </summary>
        /// <param name="key">The cache key.</param>
        void Remove(string key);

        /// <summary>
        /// Checks if a key exists in the cache.
        /// </summary>
        /// <param name="key">The cache key.</param>
        /// <returns>True if the key exists, otherwise false.</returns>
        bool Contains(string key);

        /// <summary>
        /// Populates the cache using a custom technique defined by the implementing class.
        /// </summary>
        Task Populate();
    }
}