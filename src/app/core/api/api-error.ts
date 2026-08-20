import { HttpStatusCode } from "@angular/common/http";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]> | null;
  readonly traceId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string[]> | null = null,
    traceId: string | null = null,
    retryAfterSeconds: number | null = null,
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.traceId = traceId; 
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  get isValidation(): boolean {
    return this.status === HttpStatusCode.BadRequest;
  }

  get isUnauthorized(): boolean {
    return this.status === HttpStatusCode.Unauthorized;
  }

  get isForbidden(): boolean {
    return this.status === HttpStatusCode.Forbidden;
  }

  get isNotFound(): boolean {
    return this.status === HttpStatusCode.NotFound;
  }

  get isConflict(): boolean {
    return this.status === HttpStatusCode.Conflict;
  }

  get isTooManyRequests(): boolean {
    return this.status === HttpStatusCode.TooManyRequests;
  }

  get isServerError(): boolean {
    return this.status >= HttpStatusCode.InternalServerError;
  }

  fieldErrors(field: string): readonly string[] {
    const errors = this.errors;
    if (errors === null) {
      return [];
    }

    const target = field.toLowerCase();
    for (const key of Object.keys(errors)) {
      if (key.toLowerCase() === target) {
        return errors[key];
      }
    }

    return [];
  }

  fieldError(field: string): string | null {
    const messages = this.fieldErrors(field);
    return messages.length > 0 ? messages[0] : null;
  }

  get hasFieldErrors(): boolean {
    return this.errors !== null && Object.keys(this.errors).length > 0;
  }
}
