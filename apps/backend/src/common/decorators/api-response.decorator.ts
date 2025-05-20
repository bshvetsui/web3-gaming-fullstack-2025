import { applyDecorators } from '@nestjs/common';

/**
 * Custom decorator for API responses
 * Can be extended with OpenAPI documentation
 */
export function ApiResponse(description: string) {
  return applyDecorators();
}

/**
 * Decorator for paginated responses
 */
export function ApiPaginatedResponse(type: any) {
  return applyDecorators();
}
