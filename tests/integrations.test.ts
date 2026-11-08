import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RequestContext } from "../src/core/context-manager.js";
import { createExpressMiddleware } from "../src/integrations/express.js";
import { createFastifyHook } from "../src/integrations/fastify.js";
import { createNestMiddleware } from "../src/integrations/nestjs.js";
import { createPinoMixin, createWinstonFormat } from "../src/integrations/logger.js";

describe("Framework & Logger Integrations", () => {
  describe("Express Middleware", () => {
    it("should initialize context from incoming headers and set response header", (t, done) => {
      const ctx = new RequestContext<{ requestId: string; userId?: string }>();
      const middleware = createExpressMiddleware(ctx);

      const req: any = {
        headers: {
          "x-request-id": "client-req-id"
        }
      };

      let responseHeaderSet: [string, string] | null = null;
      const res: any = {
        setHeader(name: string, value: string) {
          responseHeaderSet = [name, value];
        }
      };

      middleware(req, res, () => {
        assert.equal(ctx.isActive(), true);
        assert.equal(ctx.get("requestId"), "client-req-id");
        assert.deepEqual(responseHeaderSet, ["x-request-id", "client-req-id"]);
        done();
      });
    });

    it("should auto-generate requestId when missing", (t, done) => {
      const ctx = new RequestContext<{ requestId: string }>();
      const middleware = createExpressMiddleware(ctx);

      const req: any = { headers: {} };
      let responseHeaderVal: string | null = null;
      const res: any = {
        setHeader(name: string, value: string) {
          if (name === "x-request-id") responseHeaderVal = value;
        }
      };

      middleware(req, res, () => {
        const generatedId = ctx.get("requestId");
        assert.ok(generatedId);
        assert.equal(typeof generatedId, "string");
        assert.equal(responseHeaderVal, generatedId);
        done();
      });
    });
  });

  describe("Fastify Hook", () => {
    it("should initialize context during onRequest lifecycle", (t, done) => {
      const ctx = new RequestContext<{ requestId: string; tenantId?: string }>();
      const hook = createFastifyHook(ctx);

      const request: any = {
        headers: {
          "x-request-id": "fastify-req-123",
          "x-tenant-id": "tenant-fastify"
        }
      };

      let replyHeaderSet: [string, string] | null = null;
      const reply: any = {
        header(name: string, value: string) {
          replyHeaderSet = [name, value];
        }
      };

      hook(request, reply, () => {
        assert.equal(ctx.isActive(), true);
        assert.equal(ctx.get("requestId"), "fastify-req-123");
        assert.equal(ctx.get("tenantId"), "tenant-fastify");
        assert.deepEqual(replyHeaderSet, ["x-request-id", "fastify-req-123"]);
        done();
      });
    });
  });

  describe("NestJS Middleware", () => {
    it("should execute downstream handler inside RequestContext", (t, done) => {
      const ctx = new RequestContext<{ requestId: string; userId?: string }>();
      const middleware = createNestMiddleware(ctx, {
        extractContext: (req) => ({ userId: req.user?.id })
      });

      const req: any = {
        headers: { "x-request-id": "nest-req-1" },
        user: { id: "user-nest" }
      };
      const res: any = { setHeader: () => {} };

      middleware(req, res, () => {
        assert.equal(ctx.get("requestId"), "nest-req-1");
        assert.equal(ctx.get("userId"), "user-nest");
        done();
      });
    });
  });

  describe("Logger Integrations", () => {
    it("should return empty object for Pino mixin when outside context", () => {
      const ctx = new RequestContext();
      const mixin = createPinoMixin(ctx);
      assert.deepEqual(mixin(), {});
    });

    it("should enrich Pino logs with context data", () => {
      const ctx = new RequestContext<{ requestId: string; userId: string; token: string }>();
      const mixin = createPinoMixin(ctx, {
        keys: ["requestId", "userId"] // exclude sensitive fields like token
      });

      ctx.run({ requestId: "req-pino", userId: "user-pino", token: "secret" }, () => {
        const enriched = mixin();
        assert.deepEqual(enriched, {
          requestId: "req-pino",
          userId: "user-pino"
        });
      });
    });

    it("should nest context under targetKey when specified", () => {
      const ctx = new RequestContext<{ requestId: string }>();
      const mixin = createPinoMixin(ctx, { targetKey: "reqCtx" });

      ctx.run({ requestId: "req-nested" }, () => {
        assert.deepEqual(mixin(), {
          reqCtx: { requestId: "req-nested" }
        });
      });
    });

    it("should transform Winston log info object", () => {
      const ctx = new RequestContext<{ traceId: string }>();
      const winstonFormatter = createWinstonFormat(ctx)();

      ctx.run({ traceId: "trace-winston" }, () => {
        const logInfo = { level: "info", message: "User logged in" };
        const transformed = winstonFormatter.transform(logInfo);

        assert.equal(transformed.level, "info");
        assert.equal(transformed.message, "User logged in");
        assert.equal(transformed.traceId, "trace-winston");
      });
    });
  });
});
