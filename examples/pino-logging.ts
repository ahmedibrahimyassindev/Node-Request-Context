/**
 * Pino Logger Integration Example
 *
 * Demonstrates automatically attaching requestId and context metadata to all logs.
 */
import { RequestContext, createPinoMixin } from "../src/index.js";

interface LogContext {
  requestId: string;
  userId?: string;
  traceId?: string;
}

const context = new RequestContext<LogContext>();

// Simulate Pino logger with our mixin
const pinoMixin = createPinoMixin(context, {
  keys: ["requestId", "userId"] // only include non-sensitive fields
});

function fakePinoLog(level: string, message: string) {
  const logRecord = {
    level,
    time: Date.now(),
    msg: message,
    ...pinoMixin()
  };
  console.log(JSON.stringify(logRecord));
}

// Outside request context
fakePinoLog("info", "Server starting up...");

// Inside active request context
context.run({ requestId: "req-abc-123", userId: "usr_42" }, () => {
  fakePinoLog("info", "User accessed dashboard");
  fakePinoLog("warn", "Cache miss on analytics query");
});

// Back outside request context
fakePinoLog("info", "Scheduled maintenance completed");

