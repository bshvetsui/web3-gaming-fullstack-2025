import { applyDecorators } from '@nestjs/common';

/**
 * Custom decorator for API responses
 * Can be extended with OpenAPI documentation
 */
export function ApiResponse(_description: string) {
  return applyDecorators();
}

/**
 * Decorator for paginated responses
 */
export function ApiPaginatedResponse(_type: any) {
  return applyDecorators();
}
