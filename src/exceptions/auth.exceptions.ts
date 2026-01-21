import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom HTTP exceptions for authentication and password recovery flows
 * These exceptions provide consistent error responses across the application
 */

/**
 * Thrown when user provides invalid credentials during login
 */
export class InvalidCredentialsException extends HttpException {
  constructor() {
    super('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Thrown when a requested user is not found in the database
 */
export class UserNotFoundException extends HttpException {
  constructor(message = 'User not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Thrown when JWT token is invalid, malformed, or expired
 */
export class InvalidTokenException extends HttpException {
  constructor(message = 'Invalid or expired token') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Thrown when attempting operations on an inactive user account
 */
export class InactiveUserException extends HttpException {
  constructor() {
    super('User account is inactive', HttpStatus.FORBIDDEN);
  }
}

/**
 * Thrown when email sending fails (SMTP errors, network issues, etc.)
 */
export class EmailSendFailedException extends HttpException {
  constructor(message = 'Failed to send email') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Thrown when password update operation fails
 */
export class PasswordUpdateFailedException extends HttpException {
  constructor(message = 'Failed to update password') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
