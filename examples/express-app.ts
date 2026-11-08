/**
 * Express Request Context Example
 *
 * Demonstrates:
 * 1. Initializing context middleware with auto-generated requestId
 * 2. Reading context in controllers and deeply nested service functions
 * 3. Updating context (e.g. after authentication)
 */
import { RequestContext, createExpressMiddleware } from "../src/index.js";

// 1. Define your custom request context schema
interface AppContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
}

export const context = new RequestContext<AppContext>();

// Simulated service layer - no request/response objects passed!
async function processOrder(orderId: string) {
  const current = context.getOrThrow();
  console.log(`[OrderService] Processing order ${orderId} for User: ${current.userId} [Req: ${current.requestId}]`);
  return { orderId, processedBy: current.userId };
}

// Minimal mock express app demonstrating the flow
function runExample() {
  const middleware = createExpressMiddleware(context, {
    generateRequestId: true,
    requestIdHeader: "x-request-id"
  });

  const req: any = {
    headers: { "x-tenant-id": "tenant-corp" }
  };
  const res: any = {
    setHeader: (name: string, value: string) => console.log(`Response Header -> ${name}: ${value}`)
  };

  middleware(req, res, async () => {
    // Authenticate user & update context
    context.set("userId", "user-789");

    // Call service layer
    await processOrder("ord-1001");
  });
}

runExample();
