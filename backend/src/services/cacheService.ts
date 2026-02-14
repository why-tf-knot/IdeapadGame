/**
 * Simple in-memory cache for AI service responses
 * Prevents duplicate AI requests and saves credits
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number; // Time-to-live in milliseconds

  constructor(defaultTTL: number = 3600000) { // 1 hour default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Generate cache key from idea ID and service type
   */
  private generateKey(ideaId: string, service: string): string {
    return `${ideaId}:${service}`;
  }

  /**
   * Set a cache entry
   */
  set(ideaId: string, service: string, data: any, ttl?: number): void {
    const key = this.generateKey(ideaId, service);
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });

    console.log(`[Cache] Set: ${key} (expires in ${(expiresAt - now) / 1000}s)`);
  }

  /**
   * Get a cache entry
   */
  get(ideaId: string, service: string): any | null {
    const key = this.generateKey(ideaId, service);
    const entry = this.cache.get(key);

    if (!entry) {
      console.log(`[Cache] Miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      console.log(`[Cache] Expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] Hit: ${key}`);
    return entry.data;
  }

  /**
   * Check if a cache entry exists and is valid
   */
  has(ideaId: string, service: string): boolean {
    return this.get(ideaId, service) !== null;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(ideaId: string, service: string): void {
    const key = this.generateKey(ideaId, service);
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[Cache] Invalidated: ${key}`);
    }
  }

  /**
   * Invalidate all cache entries for a specific idea
   */
  invalidateIdea(ideaId: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${ideaId}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[Cache] Invalidated ${count} entries for idea: ${ideaId}`);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] Cleared ${size} entries`);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[Cache] Cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
const aiCacheService = new CacheService(3600000); // 1 hour TTL

export default aiCacheService;
