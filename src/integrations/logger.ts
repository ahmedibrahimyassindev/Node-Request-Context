import type { RequestContext } from "../core/context-manager.js";
import type { ContextStore } from "../core/types.js";

/**
 * Options for logger integrations.
 */
export interface LoggerIntegrationOptions {
  /**
   * Specific keys from the context to attach to log records.
   * If not specified, all keys from the context will be attached.
   */
  keys?: string[];

  /**
   * Property name to nest context fields under in the log output.
   * If omitted, context fields are merged directly into the top-level log object.
   * Example: 'context' or 'req'
   */
  targetKey?: string;
}

/**
 * Creates a mixin function for Pino loggers.
 * Automatically enriches every log entry with current request context.
 *
 * @example
 * ```typescript
 * import pino from "pino";
 * import { requestContext, createPinoMixin } from "node-request-context";
 *
 * const logger = pino({
 *   mixin: createPinoMixin(requestContext)
 * });
 * ```
 */
export function createPinoMixin<T extends ContextStore = Record<string, any>>(
  context: RequestContext<T>,
  options: LoggerIntegrationOptions = {}
): () => Record<string, any> {
  const { keys, targetKey } = options;

  return () => {
    const store = context.getContext();
    if (!store) {
      return {};
    }

    let payload: Record<string, any>;
    if (keys && keys.length > 0) {
      payload = {};
      for (const key of keys) {
        if (store[key] !== undefined) {
          payload[key] = store[key];
        }
      }
    } else {
      payload = { ...store };
    }

    if (targetKey) {
      return { [targetKey]: payload };
    }

    return payload;
  };
}

/**
 * Creates a formatter transformer for Winston loggers.
 *
 * @example
 * ```typescript
 * import winston from "winston";
 * import { requestContext, createWinstonFormat } from "node-request-context";
 *
 * const logger = winston.createLogger({
 *   format: winston.format.combine(
 *     createWinstonFormat(requestContext)(),
 *     winston.format.json()
 *   )
 * });
 * ```
 */
export function createWinstonFormat<T extends ContextStore = Record<string, any>>(
  context: RequestContext<T>,
  options: LoggerIntegrationOptions = {}
) {
  const mixin = createPinoMixin(context, options);

  return () => {
    return {
      transform(info: Record<string, any>) {
        const enriched = mixin();
        return Object.assign(info, enriched);
      }
    };
  };
}
