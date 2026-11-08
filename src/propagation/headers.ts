import { randomBytes } from "node:crypto";
import type { ContextStore, HeaderPropagationOptions } from "../core/types.js";

export const DEFAULT_HEADER_MAP: Record<string, string> = {
  requestId: "x-request-id",
  correlationId: "x-correlation-id",
  traceId: "x-trace-id",
  tenantId: "x-tenant-id",
  userId: "x-user-id"
};

export interface W3CTraceParent {
  version: string;
  traceId: string;
  parentId: string;
  flags: string;
}

/**
 * Parses a standard W3C TraceContext `traceparent` header.
 * Format: `version-traceid-parentid-flags` (e.g. `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`)
 */
export function parseW3CTraceparent(traceparent: string): W3CTraceParent | null {
  if (!traceparent || typeof traceparent !== "string") {
    return null;
  }
  const parts = traceparent.trim().split("-");
  if (parts.length < 4) {
    return null;
  }
  const [version, traceId, parentId, flags] = parts;
  if (version.length !== 2 || traceId.length !== 32 || parentId.length !== 16 || flags.length !== 2) {
    return null;
  }
  return { version, traceId, parentId, flags };
}

/**
 * Generates a standard W3C TraceContext `traceparent` header.
 */
export function formatW3CTraceparent(
  traceId: string,
  parentId?: string,
  flags: string = "01"
): string {
  const normTraceId = traceId.replace(/-/g, "").padEnd(32, "0").slice(0, 32);
  const normParentId = parentId ? parentId.replace(/-/g, "").padEnd(16, "0").slice(0, 16) : randomBytes(8).toString("hex");
  return `00-${normTraceId}-${normParentId}-${flags}`;
}

/**
 * Extracts context properties from an incoming HTTP headers record.
 * Handles case-insensitive header lookup and parses W3C traceparent if present.
 *
 * @param headers Incoming HTTP headers object (key-value pairs)
 * @param customMap Optional custom mapping from context key to header name
 */
export function extractContextFromHeaders<T extends ContextStore = Record<string, any>>(
  headers: Record<string, string | string[] | undefined>,
  customMap: Record<string, string> = DEFAULT_HEADER_MAP
): Partial<T> {
  const result: Record<string, any> = {};

  // Normalize incoming headers to lowercase
  const normalizedHeaders = new Map<string, string>();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      const headerVal = Array.isArray(value) ? value[0] : value;
      normalizedHeaders.set(key.toLowerCase(), headerVal);
    }
  }

  // Check for W3C traceparent header
  const traceparentHeader = normalizedHeaders.get("traceparent");
  if (traceparentHeader) {
    const parsed = parseW3CTraceparent(traceparentHeader);
    if (parsed) {
      result.traceId = parsed.traceId;
      result.parentId = parsed.parentId;
    }
  }

  for (const [contextKey, headerName] of Object.entries(customMap)) {
    const headerValue = normalizedHeaders.get(headerName.toLowerCase());
    if (headerValue !== undefined) {
      result[contextKey] = headerValue;
    }
  }

  return result as Partial<T>;
}

/**
 * Injects context properties into an outgoing HTTP headers record.
 * Useful for forwarding correlation IDs to downstream services via fetch, axios, etc.
 *
 * @param context Current context store or partial data
 * @param options Header propagation configuration
 */
export function injectContextHeaders(
  context: ContextStore | undefined,
  options: HeaderPropagationOptions = {}
): Record<string, string> {
  if (!context) {
    return {};
  }

  const map = { ...DEFAULT_HEADER_MAP, ...(options.headerMap ?? {}) };
  const headers: Record<string, string> = {};

  const allowedKeys = options.includeKeys ? new Set(options.includeKeys) : null;

  for (const [contextKey, headerName] of Object.entries(map)) {
    if (allowedKeys && !allowedKeys.has(contextKey)) {
      continue;
    }

    const value = context[contextKey];
    if (value !== undefined && value !== null) {
      headers[headerName] = String(value);
    }
  }

  return headers;
}
