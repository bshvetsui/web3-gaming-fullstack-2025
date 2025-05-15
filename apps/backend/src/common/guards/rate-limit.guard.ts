import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

/**
 * Rate limiting guard using in-memory storage
 * In production, use Redis for distributed rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests: Map<string, number[]> = new Map();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.get<{
      limit: number;
      windowSeconds: number;
    }>(RATE_LIMIT_KEY, context.getHandler());

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientId = this.getClientId(request);

    const now = Date.now();
    const windowMs = rateLimitConfig.windowSeconds * 1000;

    // Get existing requests for this client
    const clientRequests = this.requests.get(clientId) || [];

    // Filter out old requests outside the window
    const recentRequests = clientRequests.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (recentRequests.length >= rateLimitConfig.limit) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private getClientId(request: any): string {
    // Use IP address as client identifier
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  private cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    this.requests.forEach((timestamps, clientId) => {
      const recent = timestamps.filter((t) => now - t < maxAge);

      if (recent.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, recent);
      }
    });
  }
}
