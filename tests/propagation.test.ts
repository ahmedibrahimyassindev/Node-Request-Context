import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractContextFromHeaders,
  injectContextHeaders,
  parseW3CTraceparent,
  formatW3CTraceparent
} from "../src/propagation/headers.js";
import {
  serializeContext,
  deserializeContext
} from "../src/propagation/serializers.js";

describe("Context Propagation", () => {
  describe("Headers Propagation", () => {
    it("should extract context from case-insensitive headers", () => {
      const headers = {
        "X-Request-Id": "req-123",
        "x-correlation-id": "corr-456",
        "X-Tenant-ID": "tenant-abc"
      };

      const extracted = extractContextFromHeaders(headers);

      assert.equal(extracted.requestId, "req-123");
      assert.equal(extracted.correlationId, "corr-456");
      assert.equal(extracted.tenantId, "tenant-abc");
    });

    it("should extract and parse W3C traceparent header", () => {
      const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
      const parentId = "00f067aa0ba902b7";
      const headers = {
        traceparent: `00-${traceId}-${parentId}-01`
      };

      const extracted = extractContextFromHeaders(headers);
      assert.equal(extracted.traceId, traceId);
      assert.equal((extracted as any).parentId, parentId);
    });

    it("should format and parse valid W3C traceparent strings", () => {
      const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
      const formatted = formatW3CTraceparent(traceId);
      const parsed = parseW3CTraceparent(formatted);

      assert.ok(parsed);
      assert.equal(parsed.version, "00");
      assert.equal(parsed.traceId, traceId);
      assert.equal(parsed.flags, "01");
    });

    it("should return null for malformed traceparent strings", () => {
      assert.equal(parseW3CTraceparent("invalid"), null);
      assert.equal(parseW3CTraceparent("00-short-id-01"), null);
    });

    it("should inject context into outgoing headers", () => {
      const context = {
        requestId: "req-789",
        correlationId: "corr-999",
        ignoredField: "secret"
      };

      const injected = injectContextHeaders(context);

      assert.equal(injected["x-request-id"], "req-789");
      assert.equal(injected["x-correlation-id"], "corr-999");
      assert.equal((injected as any)["ignoredField"], undefined);
    });

    it("should filter injected headers when includeKeys is specified", () => {
      const context = {
        requestId: "req-1",
        correlationId: "corr-1",
        tenantId: "tenant-1"
      };

      const injected = injectContextHeaders(context, {
        includeKeys: ["requestId"]
      });

      assert.equal(injected["x-request-id"], "req-1");
      assert.equal(injected["x-correlation-id"], undefined);
      assert.equal(injected["x-tenant-id"], undefined);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize context properly", () => {
      const context = {
        requestId: "req-json",
        userId: "user-42",
        metadata: { source: "job-queue" }
      };

      const serialized = serializeContext(context);
      assert.equal(typeof serialized, "string");

      const deserialized = deserializeContext<typeof context>(serialized);
      assert.deepEqual(deserialized, context);
    });

    it("should safely handle empty or invalid JSON", () => {
      assert.equal(serializeContext(undefined), "{}");
      assert.deepEqual(deserializeContext("invalid-json"), {});
    });
  });
});
