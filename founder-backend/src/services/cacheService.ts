/**
 * Simple in-memory cache for AI service responses
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    setInterval(() => this.cleanup(), 300000);
  }

  private generateKey(ideaId: string, service: string): string {
    return `${ideaId}:${service}`;
  }

  set(ideaId: string, service: string, data: any, ttl?: number): void {
    const key = this.generateKey(ideaId, service);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  get(ideaId: string, service: string): any | null {
    const key = this.generateKey(ideaId, service);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  invalidate(ideaId: string, service: string): void {
    this.cache.delete(this.generateKey(ideaId, service));
  }

  invalidateIdea(ideaId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${ideaId}:`)) this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) this.cache.delete(key);
    }
  }
}

const aiCacheService = new CacheService(3600000);
export default aiCacheService;
