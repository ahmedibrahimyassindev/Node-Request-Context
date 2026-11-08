/**
 * Winston Logger Integration Example
 *
 * Demonstrates automatically attaching requestId and context metadata to all logs in Winston.
 */
import { RequestContext, createWinstonFormat } from "../src/index.js";

interface LogContext {
  requestId: string;
  userId?: string;
  correlationId?: string;
}

const context = new RequestContext<LogContext>();

// Simulate Winston format transformer
const winstonFormat = createWinstonFormat(context, {
  keys: ["requestId", "correlationId"]
})();

function fakeWinstonLog(level: string, message: string) {
  const info: Record<string, any> = { level, message, timestamp: new Date().toISOString() };
  const transformed = winstonFormat.transform(info);
  console.log(`[WINSTON] ${JSON.stringify(transformed)}`);
}

// Log outside request context
fakeWinstonLog("info", "Application initialized");

// Log inside active request context
context.run({ requestId: "req-winston-777", correlationId: "corr-888" }, () => {
  fakeWinstonLog("info", "User accessed protected endpoint");
  fakeWinstonLog("error", "Database connection timeout");
});

