import { randomUUID } from "node:crypto";
import type { RequestContext } from "../core/context-manager.js";
import type { ContextStore } from "../core/types.js";
import { extractContextFromHeaders } from "../propagation/headers.js";

export interface FastifyHookOptions<T extends ContextStore> {
  extractContext?: (request: any) => Partial<T> | Promise<Partial<T>>;
  generateRequestId?: boolean;
  requestIdHeader?: string;
}

/**
 * Creates Fastify onRequest hook handler to run requests within the context.
 */
export function createFastifyHook<T extends ContextStore = Record<string, any>>(
  context: RequestContext<T>,
  options: FastifyHookOptions<T> = {}
) {
  const {
    generateRequestId = true,
    requestIdHeader = "x-request-id",
    extractContext
  } = options;

  return (request: any, reply: any, done: (err?: any) => void) => {
    const fromHeaders = extractContextFromHeaders<T>(request.headers || {});
    const custom = extractContext ? extractContext(request) : {};

    const resolveAndRun = (customData: Partial<T>) => {
      const initialStore: any = {
        ...fromHeaders,
        ...customData
      };

      if (generateRequestId && !initialStore.requestId) {
        initialStore.requestId = randomUUID();
      }

      if (requestIdHeader && initialStore.requestId && reply.header) {
        reply.header(requestIdHeader, initialStore.requestId);
      }

      context.run(initialStore as T, () => {
        done();
      });
    };

    if (custom instanceof Promise) {
      custom.then(resolveAndRun).catch(done);
    } else {
      resolveAndRun(custom);
    }
  };
}

