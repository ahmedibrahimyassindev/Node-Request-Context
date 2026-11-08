import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RequestContext } from "../src/core/context-manager.js";
import { ContextMissingError } from "../src/core/errors.js";

describe("RequestContext Core", () => {
  it("should return undefined context when not running inside scope", () => {
    const ctx = new RequestContext();
    assert.equal(ctx.getContext(), undefined);
    assert.equal(ctx.getStore(), undefined);
    assert.equal(ctx.isActive(), false);
    assert.equal(ctx.get("userId"), undefined);
  });

  it("should throw ContextMissingError when getOrThrow() is called outside scope", () => {
    const ctx = new RequestContext();
    assert.throws(
      () => ctx.getOrThrow(),
      (err: any) => err instanceof ContextMissingError
    );
  });

  it("should throw ContextMissingError when set() is called outside scope", () => {
    const ctx = new RequestContext();
    assert.throws(
      () => ctx.set("userId", "123"),
      (err: any) => err instanceof ContextMissingError
    );
  });

  it("should provide context within run()", () => {
    const ctx = new RequestContext<{ requestId: string; userId?: string }>();

    const result = ctx.run({ requestId: "req-1" }, () => {
      assert.equal(ctx.isActive(), true);
      assert.equal(ctx.getContext()?.requestId, "req-1");
      assert.equal(ctx.get("requestId"), "req-1");

      ctx.set("userId", "user-99");
      assert.equal(ctx.get("userId"), "user-99");

      return "done";
    });

    assert.equal(result, "done");
    assert.equal(ctx.isActive(), false);
  });

  it("should preserve context through async operations", async () => {
    const ctx = new RequestContext<{ requestId: string }>();

    await ctx.run({ requestId: "async-123" }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(ctx.get("requestId"), "async-123");

      await Promise.resolve();
      assert.equal(ctx.getOrThrow().requestId, "async-123");
    });
  });

  it("should preserve context across bound function calls", (t, done) => {
    const ctx = new RequestContext<{ traceId: string }>();

    ctx.run({ traceId: "bound-trace" }, () => {
      const boundFn = ctx.bind(() => {
        assert.equal(ctx.get("traceId"), "bound-trace");
        done();
      });

      // Execute on next tick outside of synchronous run
      process.nextTick(boundFn);
    });
  });
});

