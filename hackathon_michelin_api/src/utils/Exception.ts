import type { ApiException } from '../../types/Exception.ts'

// 400 - Bad Request / Validation Error
export const BadRequestError = (message: string): ApiException => ({
  code: 'BAD_REQUEST',
  message,
  status: 400
})

// 404 - Not Found
export const NotFoundError = (message: string = 'Resource not found'): ApiException => ({
  code: 'NOT_FOUND',
  message,
  status: 404
})

// 403 - Forbidden
export const ForbiddenError = (message: string = 'Access forbidden'): ApiException => ({
  code: 'FORBIDDEN',
  message,
  status: 403
})

// 401 - Unauthorized
export const UnauthorizedError = (message: string = 'Unauthorized'): ApiException => ({
  code: 'UNAUTHORIZED',
  message,
  status: 401
})

// 500 - Internal Server Error
export const ServerError = (message: string = 'Internal server error'): ApiException => ({
  code: 'INTERNAL_SERVER_ERROR',
  message,
  status: 500
})
