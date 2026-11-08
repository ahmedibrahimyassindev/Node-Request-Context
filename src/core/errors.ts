/**
 * Thrown when an operation requires an active request context but none is found.
 */
export class ContextMissingError extends Error {
  constructor(
    message: string = "No active request context found in current asynchronous execution scope."
  ) {
    super(message);
    this.name = "ContextMissingError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

