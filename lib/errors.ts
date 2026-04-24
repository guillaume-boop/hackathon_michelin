import { NextResponse } from 'next/server'
import type { ApiException } from '@/types/Exception'

export const apiError = (exception: ApiException) =>
  NextResponse.json(exception, { status: exception.status })

export const BadRequestError = (message: string): ApiException => ({
  code: 'BAD_REQUEST',
  message,
  status: 400,
})

export const NotFoundError = (message = 'Resource not found'): ApiException => ({
  code: 'NOT_FOUND',
  message,
  status: 404,
})

export const UnauthorizedError = (message = 'Unauthorized'): ApiException => ({
  code: 'UNAUTHORIZED',
  message,
  status: 401,
})

export const ServerError = (message = 'Internal server error'): ApiException => ({
  code: 'INTERNAL_SERVER_ERROR',
  message,
  status: 500,
})
