import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Lightweight JWT auth guard placeholder.
 * In real deployments this should validate and decode the JWT token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Provide a mock user object so downstream services can rely on it.
    if (!request.user) {
      request.user = {
        id: request.headers['x-user-id'] || 'demo-user',
        address:
          request.headers['x-wallet-address'] || '0x0000000000000000000000000000000000000000',
      };
    }

    return true;
  }
}
