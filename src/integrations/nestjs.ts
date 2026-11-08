import { randomUUID } from "node:crypto";
import type { RequestContext } from "../core/context-manager.js";
import type { ContextStore } from "../core/types.js";
import { extractContextFromHeaders } from "../propagation/headers.js";

export interface NestIntegrationOptions<T extends ContextStore> {
  extractContext?: (req: any) => Partial<T> | Promise<Partial<T>>;
  generateRequestId?: boolean;
  requestIdHeader?: string;
}

/**
 * Helper to create a NestJS-compatible middleware class or function.
 * Can be used in `configure(consumer: MiddlewareConsumer)` of any Nest module.
 */
export function createNestMiddleware<T extends ContextStore = Record<string, any>>(
  context: RequestContext<T>,
  options: NestIntegrationOptions<T> = {}
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

      if (requestIdHeader && initialStore.requestId && res?.setHeader) {
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

