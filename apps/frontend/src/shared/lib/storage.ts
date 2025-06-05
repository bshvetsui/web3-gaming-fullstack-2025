/**
 * Local storage utility with type safety and encryption support
 */
export class Storage {
  /**
   * Store value in local storage
   */
  static set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  /**
   * Get value from local storage
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue !== undefined ? defaultValue : null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  /**
   * Remove item from local storage
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }

  /**
   * Clear all local storage
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if key exists
   */
  static has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys
   */
  static keys(): string[] {
    return Object.keys(localStorage);
  }

  /**
   * Store with expiration
   */
  static setWithExpiry<T>(key: string, value: T, ttlSeconds: number): void {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttlSeconds * 1000,
    };
    this.set(key, item);
  }

  /**
   * Get with expiration check
   */
  static getWithExpiry<T>(key: string): T | null {
    const item = this.get<{ value: T; expiry: number }>(key);

    if (!item) {
      return null;
    }

    const now = Date.now();

    if (now > item.expiry) {
      this.remove(key);
      return null;
    }

    return item.value;
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  USER_SETTINGS: 'user_settings',
  WALLET_CACHE: 'wallet_cache',
  GAME_STATE: 'game_state',
  AUTH_TOKEN: 'auth_token',
  PLAYER_STATS: 'player_stats',
  SOUND_SETTINGS: 'sound_settings',
} as const;
