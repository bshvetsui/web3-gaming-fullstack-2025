import * as React from 'react';

/**
 * Performance monitoring and optimization utilities
 */

/**
 * Lazy load component with preloading support
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(factory);

  return Object.assign(LazyComponent, {
    preload: factory,
  });
}

/**
 * Debounced value hook for performance optimization
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Performance metric tracking
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start tracking a metric
   */
  startMeasure(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const existing = this.metrics.get(name) || [];
      existing.push(duration);

      // Keep only last 100 measurements
      if (existing.length > 100) {
        existing.shift();
      }

      this.metrics.set(name, existing);
    };
  }

  /**
   * Get average time for a metric
   */
  getAverage(name: string): number {
    const measurements = this.metrics.get(name);

    if (!measurements || measurements.length === 0) {
      return 0;
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {};

    this.metrics.forEach((measurements, name) => {
      result[name] = {
        avg: this.getAverage(name),
        count: measurements.length,
      };
    });

    return result;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}
