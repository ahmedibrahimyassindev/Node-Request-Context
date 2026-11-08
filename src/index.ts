import { RequestContext } from "./core/context-manager.js";

// Core
export { RequestContext } from "./core/context-manager.js";
export { ContextMissingError } from "./core/errors.js";
export type {
  ContextOptions,
  ContextStore,
  HeaderPropagationOptions,
  StandardHeaders
} from "./core/types.js";

// Integrations
export {
  createExpressMiddleware,
  type ExpressMiddlewareOptions
} from "./integrations/express.js";

export {
  createFastifyHook,
  type FastifyHookOptions
} from "./integrations/fastify.js";

export {
  createNestMiddleware,
  type NestIntegrationOptions
} from "./integrations/nestjs.js";

export {
  createPinoMixin,
  createWinstonFormat,
  type LoggerIntegrationOptions
} from "./integrations/logger.js";

// Propagation
export {
  DEFAULT_HEADER_MAP,
  extractContextFromHeaders,
  formatW3CTraceparent,
  injectContextHeaders,
  parseW3CTraceparent,
  type W3CTraceParent
} from "./propagation/headers.js";

export {
  deserializeContext,
  serializeContext
} from "./propagation/serializers.js";

/**
 * Pre-configured global default RequestContext singleton for convenience.
 */
export const defaultContext = new RequestContext<Record<string, any>>({
  name: "default"
});

/**
 * Alias for defaultContext.
 */
export const requestContext = defaultContext;
