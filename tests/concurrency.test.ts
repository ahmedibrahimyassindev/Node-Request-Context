import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RequestContext } from "../src/core/context-manager.js";

describe("RequestContext Concurrency & Isolation", () => {
  it("should keep concurrent async requests completely isolated", async () => {
    const ctx = new RequestContext<{ id: number; delay: number }>();
    const completed: number[] = [];

    const runWorker = async (id: number, delay: number) => {
      return ctx.run({ id, delay }, async () => {
        // Ensure starting state is correct
        assert.equal(ctx.get("id"), id);

        // Sleep for varying times to mix execution interleaving
        await new Promise((resolve) => setTimeout(resolve, delay));

        // After sleep, verify context has not been overwritten by another worker
        assert.equal(ctx.get("id"), id);
        assert.equal(ctx.get("delay"), delay);

        completed.push(id);
        return id;
      });
    };

    // Run 50 concurrent tasks with interleaved delays
    const tasks = Array.from({ length: 50 }, (_, i) => {
      const delay = (50 - i) * 2; // inverse delay to ensure out-of-order execution
      return runWorker(i, delay);
    });

    const results = await Promise.all(tasks);

    assert.equal(results.length, 50);
    assert.equal(completed.length, 50);
    for (let i = 0; i < 50; i++) {
      assert.equal(results[i], i);
    }
  });

  it("should support nested contexts without corrupting parent scope", () => {
    const ctx = new RequestContext<{ level: number; tag: string }>();

    ctx.run({ level: 1, tag: "parent" }, () => {
      assert.equal(ctx.get("level"), 1);
      assert.equal(ctx.get("tag"), "parent");

      ctx.run({ level: 2, tag: "child" }, () => {
        assert.equal(ctx.get("level"), 2);
        assert.equal(ctx.get("tag"), "child");
      });

      // After child finishes, parent is restored
      assert.equal(ctx.get("level"), 1);
      assert.equal(ctx.get("tag"), "parent");
    });
  });
});

