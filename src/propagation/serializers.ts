import type { ContextStore } from "../core/types.js";

/**
 * Serializes a context store into a JSON string for passing over message queues or background jobs.
 */
export function serializeContext(context: ContextStore | undefined): string {
  if (!context) {
    return "{}";
  }
  return JSON.stringify(context);
}

/**
 * Deserializes a context JSON string back into a context object.
 */
export function deserializeContext<T extends ContextStore = Record<string, any>>(
  serialized: string
): Partial<T> {
  try {
    return JSON.parse(serialized);
  } catch {
    return {};
  }
}

