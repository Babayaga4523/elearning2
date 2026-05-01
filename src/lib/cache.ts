/**
 * Caching Strategy
 * In-memory LRU cache for frequently accessed data
 * For production with multiple instances, consider Redis
 */

import { log } from "@/lib/logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  set(key: string, value: T, ttlSeconds: number = 300): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + "%",
    };
  }
}

// Create cache instances for different data types
const courseCache = new LRUCache<any>(50);
const userCache = new LRUCache<any>(100);
const enrollmentCache = new LRUCache<any>(200);
const testCache = new LRUCache<any>(50);

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get or set course data
   */
  course: {
    get: (courseId: string) => courseCache.get(`course:${courseId}`),
    set: (courseId: string, data: any, ttl: number = 300) =>
      courseCache.set(`course:${courseId}`, data, ttl),
    delete: (courseId: string) => courseCache.delete(`course:${courseId}`),
    clear: () => courseCache.clear(),
  },

  /**
   * Get or set user data
   */
  user: {
    get: (userId: string) => userCache.get(`user:${userId}`),
    set: (userId: string, data: any, ttl: number = 600) =>
      userCache.set(`user:${userId}`, data, ttl),
    delete: (userId: string) => userCache.delete(`user:${userId}`),
    clear: () => userCache.clear(),
  },

  /**
   * Get or set enrollment data
   */
  enrollment: {
    get: (userId: string, courseId: string) =>
      enrollmentCache.get(`enrollment:${userId}:${courseId}`),
    set: (userId: string, courseId: string, data: any, ttl: number = 300) =>
      enrollmentCache.set(`enrollment:${userId}:${courseId}`, data, ttl),
    delete: (userId: string, courseId: string) =>
      enrollmentCache.delete(`enrollment:${userId}:${courseId}`),
    clear: () => enrollmentCache.clear(),
  },

  /**
   * Get or set test data
   */
  test: {
    get: (testId: string) => testCache.get(`test:${testId}`),
    set: (testId: string, data: any, ttl: number = 600) =>
      testCache.set(`test:${testId}`, data, ttl),
    delete: (testId: string) => testCache.delete(`test:${testId}`),
    clear: () => testCache.clear(),
  },

  /**
   * Clear all caches
   */
  clearAll: () => {
    courseCache.clear();
    userCache.clear();
    enrollmentCache.clear();
    testCache.clear();
    log.info("All caches cleared");
  },

  /**
   * Get cache statistics
   */
  getStats: () => ({
    course: courseCache.getStats(),
    user: userCache.getStats(),
    enrollment: enrollmentCache.getStats(),
    test: testCache.getStats(),
  }),
};

/**
 * Cache wrapper for async functions
 * Automatically caches function results
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300,
  cacheInstance: LRUCache<T> = new LRUCache<T>()
): Promise<T> {
  // Try to get from cache
  const cached = cacheInstance.get(key);
  if (cached !== null) {
    log.debug(`Cache hit: ${key}`);
    return cached;
  }

  // Cache miss - execute function
  log.debug(`Cache miss: ${key}`);
  const result = await fn();

  // Store in cache
  cacheInstance.set(key, result, ttlSeconds);

  return result;
}

/**
 * Invalidate cache on data mutation
 * Call this after create/update/delete operations
 */
export function invalidateCache(type: "course" | "user" | "enrollment" | "test", id: string) {
  switch (type) {
    case "course":
      cache.course.delete(id);
      log.debug(`Cache invalidated: course:${id}`);
      break;
    case "user":
      cache.user.delete(id);
      log.debug(`Cache invalidated: user:${id}`);
      break;
    case "test":
      cache.test.delete(id);
      log.debug(`Cache invalidated: test:${id}`);
      break;
  }
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const stats = cache.getStats();
  log.debug("Cache statistics", stats);
}, 5 * 60 * 1000);
