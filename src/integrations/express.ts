import { randomUUID } from "node:crypto";
import type { RequestContext } from "../core/context-manager.js";
import type { ContextStore } from "../core/types.js";
import { extractContextFromHeaders } from "../propagation/headers.js";

export interface ExpressMiddlewareOptions<T extends ContextStore> {
  /**
   * Custom function to extract context data from the incoming request.
   * Receives `req` and returns partial or complete context data.
   */
  extractContext?: (req: any) => Partial<T> | Promise<Partial<T>>;

  /**
   * If true, generates a random UUID for `requestId` if none exists on incoming headers.
   * Default: true
   */
  generateRequestId?: boolean;

  /**
   * Response header name to echo back the requestId.
   * Default: 'x-request-id'
   */
  requestIdHeader?: string;
}

/**
 * Creates an Express/Connect-compatible middleware that initializes the RequestContext
 * for the duration of the HTTP request lifecycle.
 */
export function createExpressMiddleware<T extends ContextStore = Record<string, any>>(
  context: RequestContext<T>,
  options: ExpressMiddlewareOptions<T> = {}
) {
  const {
    generateRequestId = true,
    requestIdHeader = "x-request-id",
    extractContext
  } = options;

  return (req: any, res: any, next: (err?: any) => void) => {
    const fromHeaders = extractContextFromHeaders<T>(req.headers || {});
    const custom = extractContext ? extractContext(req) : {};

    const resolveAndRun = (customData: Partial<T>) => {
      const initialStore: any = {
        ...fromHeaders,
        ...customData
      };

      if (generateRequestId && !initialStore.requestId) {
        initialStore.requestId = randomUUID();
      }

      if (requestIdHeader && initialStore.requestId && res.setHeader) {
        res.setHeader(requestIdHeader, initialStore.requestId);
      }

      context.run(initialStore as T, () => {
        next();
      });
    };

    if (custom instanceof Promise) {
      custom.then(resolveAndRun).catch(next);
    } else {
      resolveAndRun(custom);
    }
  };
}

