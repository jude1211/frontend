// Request caching and deduplication service
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  // Generate cache key from endpoint and options
  private getCacheKey(endpoint: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  // Check if cache entry is still valid
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Get cached data if valid
  get<T>(endpoint: string, options?: RequestInit): T | null {
    const key = this.getCacheKey(endpoint, options);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log('🎯 Cache hit:', endpoint);
      return entry.data;
    }
    
    if (entry) {
      // Remove expired entry
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set cached data
  set<T>(endpoint: string, data: T, ttl?: number): void {
    const key = this.getCacheKey(endpoint);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
    console.log('💾 Cached:', endpoint, 'TTL:', ttl || this.defaultTTL);
  }

  // Check if request is already pending
  getPendingRequest<T>(endpoint: string, options?: RequestInit): Promise<T> | null {
    const key = this.getCacheKey(endpoint, options);
    const pending = this.pendingRequests.get(key);
    
    if (pending && Date.now() - pending.timestamp < 30000) { // 30 second timeout for pending requests
      console.log('⏳ Request deduplication:', endpoint);
      return pending.promise;
    }
    
    if (pending) {
      // Remove stale pending request
      this.pendingRequests.delete(key);
    }
    
    return null;
  }

  // Set pending request
  setPendingRequest<T>(endpoint: string, promise: Promise<T>, options?: RequestInit): void {
    const key = this.getCacheKey(endpoint, options);
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });
  }

  // Clear pending request
  clearPendingRequest(endpoint: string, options?: RequestInit): void {
    const key = this.getCacheKey(endpoint, options);
    this.pendingRequests.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ Cache cleared');
  }

  // Clear cache for specific endpoint pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    console.log('🗑️ Cache cleared for pattern:', pattern);
  }

  // Get cache stats
  getStats(): { cacheSize: number; pendingRequests: number } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
}

export const requestCache = new RequestCache();

