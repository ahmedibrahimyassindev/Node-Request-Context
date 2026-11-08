/**
 * Base constraint for request context records.
 */
export type ContextStore = Record<string | symbol, any>;

/**
 * Configuration options when instantiating a RequestContext.
 */
export interface ContextOptions {
  /**
   * Optional name for debugging or tracing purposes.
   */
  name?: string;
}

/**
 * Standard HTTP headers used for tracing and correlation.
 */
export interface StandardHeaders {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  tenantId?: string;
  userId?: string;
}

/**
 * Options for header propagation.
 */
export interface HeaderPropagationOptions {
  /**
   * Header name mapping from context keys to HTTP header names.
   * Default:
   * requestId -> 'x-request-id'
   * correlationId -> 'x-correlation-id'
   * traceId -> 'x-trace-id'
   * tenantId -> 'x-tenant-id'
   */
  headerMap?: Record<string, string>;

  /**
   * List of context keys to include when injecting headers.
   * If omitted, all mapped keys that exist in context are injected.
   */
  includeKeys?: string[];
}

