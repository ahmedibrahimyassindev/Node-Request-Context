import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RequestContext } from "../src/core/context-manager.js";

describe("Performance & Benchmark", () => {
  it("should benchmark run, get, and set operations efficiently", () => {
    const ctx = new RequestContext<{ counter: number; id: string }>();
    const iterations = 50_000;

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      ctx.run({ counter: i, id: `req-${i}` }, () => {
        const val = ctx.get("counter");
        ctx.set("counter", (val ?? 0) + 1);
        assert.equal(ctx.get("counter"), i + 1);
      });
    }

    const durationMs = performance.now() - start;
    const opsPerSec = Math.round((iterations / (durationMs / 1000)));

    assert.ok(durationMs > 0);
    // Log benchmark throughput for visibility
    console.log(`       ⚡ Benchmark throughput: ${opsPerSec.toLocaleString()} ops/sec (${iterations} cycles in ${durationMs.toFixed(2)}ms)`);
  });
});
