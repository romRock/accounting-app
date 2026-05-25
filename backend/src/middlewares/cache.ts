import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

// Create cache instance with 30-minute default TTL
const cache = new NodeCache({
  stdTTL: 1800, // 30 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Performance optimization - don't clone objects
});

/**
 * Cache middleware for GET requests
 * Caches responses based on request URL
 * Does not cache POST/PUT/DELETE requests
 * Does not interfere with authentication or authorization
 */
export function cacheMiddleware(ttl: number = 1800) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests that might have user-specific data
    // This ensures each user gets their own data
    const key = req.originalUrl + (req.user?.id || '');

    // Check if response is cached
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      console.log(`✅ Cache HIT: ${req.originalUrl}`);
      return res.json(cachedResponse);
    }

    console.log(`❌ Cache MISS: ${req.originalUrl}`);

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttl);
        console.log(`💾 Cached: ${req.originalUrl} (TTL: ${ttl}s)`);
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache by pattern
 * Used when data is modified (POST/PUT/DELETE)
 */
export function invalidateCachePattern(pattern: string) {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
      console.log(`🗑️ Cache invalidated: ${key}`);
    }
  });
}

/**
 * Invalidate all cache
 * Used for major data changes
 */
export function invalidateAllCache() {
  cache.flushAll();
  console.log('🗑️ All cache invalidated');
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats() {
  const stats = cache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize
  };
}
