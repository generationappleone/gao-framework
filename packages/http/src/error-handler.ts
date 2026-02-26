import { ValidationError, isGaoError } from '@gao/core';
import { GaoResponse } from './response.js';

export function errorHandler(error: unknown): Response {
  const res = new GaoResponse();

  if (isGaoError(error)) {
    let details: any = undefined;

    // If it's a validation error, extract the field errors into details
    if (error instanceof ValidationError) {
      details = error.errors;
    }

    return res.error(error.statusCode, error.code, error.message, details);
  }

  // Unhandled generic errors
  if (error instanceof Error) {
    console.error('Unhandled Exception:', error.stack || error.message);
    return res.error(
      500,
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred.',
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
    );
  }

  // Strings or other unknown types
  console.error('Unknown Error Type:', error);
  return res.error(500, 'INTERNAL_SERVER_ERROR', 'An undefined error occurred.');
}
