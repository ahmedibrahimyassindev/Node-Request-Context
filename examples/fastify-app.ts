/**
 * Fastify Request Context Example
 *
 * Demonstrates:
 * 1. Registering Fastify onRequest hook with auto-generated requestId
 * 2. Reading context inside route handlers
 */
import { RequestContext, createFastifyHook } from "../src/index.js";

interface AppContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
}

export const context = new RequestContext<AppContext>();

// Mock Fastify server demonstrating the onRequest lifecycle
function runFastifyExample() {
  const hook = createFastifyHook(context, {
    generateRequestId: true,
    requestIdHeader: "x-request-id"
  });

  const request: any = {
    headers: {
      "x-tenant-id": "tenant-fastify-99"
    }
  };

  const reply: any = {
    header: (name: string, value: string) => console.log(`Reply Header -> ${name}: ${value}`)
  };

  // Simulate Fastify hook execution
  hook(request, reply, () => {
    // Inside route handler
    const current = context.getOrThrow();
    console.log(`[FastifyHandler] Request ID: ${current.requestId}`);
    console.log(`[FastifyHandler] Tenant ID:  ${current.tenantId}`);
  });
}

runFastifyExample();

