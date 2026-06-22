import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain-level exception carrying a machine-readable `code` alongside the
 * HTTP status. Thrown by services for expected business-rule violations
 * (e.g. invalid shipment status transition) and rendered by `BusinessExceptionFilter`.
 */
export class BusinessException extends HttpException {
  public readonly code: string;

  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ code, message }, status);
    this.code = code;
  }
}

/** Convenience subclasses for the most common cases. */
export class ResourceNotFoundException extends BusinessException {
  constructor(entity: string, id?: string) {
    super(
      'RESOURCE_NOT_FOUND',
      id ? `${entity} with id "${id}" was not found` : `${entity} was not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidStateTransitionException extends BusinessException {
  constructor(from: string, to: string) {
    super(
      'INVALID_STATE_TRANSITION',
      `Cannot transition from "${from}" to "${to}"`,
      HttpStatus.CONFLICT,
    );
  }
}
