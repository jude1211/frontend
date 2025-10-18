// Request throttling utility to prevent rapid successive requests
interface ThrottleConfig {
  delay: number; // Minimum delay between requests in milliseconds
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

class RequestThrottle {
  private requestTimes: Map<string, number[]> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  // Throttle a request based on endpoint and config
  async throttle<T>(
    key: string, 
    requestFn: () => Promise<T>, 
    config: ThrottleConfig = { delay: 1000, maxRequests: 5, windowMs: 60000 }
  ): Promise<T> {
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Deduplicating request for ${key} - returning existing promise`);
      return this.pendingRequests.get(key)!;
    }

    const now = Date.now();
    const requestTimes = this.requestTimes.get(key) || [];
    const lastRequest = this.lastRequestTime.get(key) || 0;

    // Check if we need to wait due to minimum delay
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < config.delay) {
      const waitTime = config.delay - timeSinceLastRequest;
      console.log(`⏳ Throttling request for ${key}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check if we've exceeded max requests in window
    const recentRequests = requestTimes.filter(time => now - time < config.windowMs);
    if (recentRequests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = config.windowMs - (now - oldestRequest);
      console.log(`⏳ Rate limiting request for ${key}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Record this request
    this.requestTimes.set(key, [...recentRequests, now]);
    this.lastRequestTime.set(key, now);

    // Create and store the request promise
    const requestPromise = requestFn().finally(() => {
      // Clean up the pending request when it completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, requestPromise);

    // Execute the request
    return requestPromise;
  }

  // Clear throttle data for a specific key
  clear(key: string): void {
    this.requestTimes.delete(key);
    this.lastRequestTime.delete(key);
    this.pendingRequests.delete(key);
  }

  // Clear all throttle data
  clearAll(): void {
    this.requestTimes.clear();
    this.lastRequestTime.clear();
    this.pendingRequests.clear();
  }

  // Get throttle stats for a key
  getStats(key: string): { recentRequests: number; lastRequest: number | null } {
    const now = Date.now();
    const requestTimes = this.requestTimes.get(key) || [];
    const recentRequests = requestTimes.filter(time => now - time < 60000).length;
    const lastRequest = this.lastRequestTime.get(key) || null;
    
    return { recentRequests, lastRequest };
  }
}

export const requestThrottle = new RequestThrottle();

