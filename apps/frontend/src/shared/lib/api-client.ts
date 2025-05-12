/**
 * API Client with automatic retry and caching
 */

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

class APIClient {
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<T> {
    const {
      timeout = 10000,
      retries = 3,
      cache: useCache = false,
      cacheTTL = 300000, // 5 minutes
      ...fetchConfig
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${url}-${JSON.stringify(fetchConfig.body || '')}`;

    // Check cache
    if (useCache && fetchConfig.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }
    }

    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Cache successful GET requests
        if (useCache && fetchConfig.method === 'GET') {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(endpoint: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter((key) => key.includes(endpoint));
    matchingKeys.forEach((key) => this.cache.delete(key));
  }
}

// Export singleton instance
export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
);
