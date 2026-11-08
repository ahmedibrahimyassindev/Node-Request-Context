# Node Request Context

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)

A lightweight, framework-agnostic request context manager for Node.js applications, powered by `AsyncLocalStorage`.

---

## Overview

Managing request-related information across different architectural layers of a backend application becomes challenging as the codebase grows.

A typical HTTP request passes through multiple layers:

- Middleware
- Controllers
- Services
- Repositories
- External API clients
- Background task dispatchers

These layers frequently require access to common contextual data, such as:

- **Correlation & Tracing:** `requestId`, `correlationId`, `traceId`
- **Identity & Tenancy:** `userId`, `tenantId`, `roles`
- **Audit & Metadata:** `ipAddress`, `userAgent`, `locale`

Without a centralized context mechanism, developers must explicitly pass this information as function parameters through every layer ("parameter drilling"). This introduces tight coupling, clutters method signatures, and complicates refactoring.

**Node Request Context** provides a centralized, type-safe asynchronous execution context using Node.js's native `AsyncLocalStorage`, allowing any component in the execution call tree to read and update request data without parameter drilling.

---

## The Problem

Consider the following parameter-drilling example:

```typescript
// Controller Layer
async function createOrder(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user.id;

    await orderService.create({ requestId, userId, items: req.body.items });
    res.json({ success: true });
}

// Service Layer
async function create(orderData: CreateOrderDto) {
    // Must forward context parameters to downstream services
    await paymentService.charge({
        requestId: orderData.requestId,
        userId: orderData.userId,
        amount: orderData.total
    });
}
```

As new contextual fields (such as tenant IDs or trace spans) are introduced, every intermediary function signature must be updated.

---

## The Solution

Node Request Context encapsulates contextual state within the asynchronous execution chain:

```typescript
import { requestContext } from "@ahmedyassin/node-request-context";

async function create(orderData: CreateOrderDto) {
    // Access context directly anywhere in the async execution chain
    const context = requestContext.getContext();

    console.log(`Processing order for user ${context?.userId} [Request: ${context?.requestId}]`);

    await paymentService.charge({ amount: orderData.total });
}
```

Each asynchronous flow maintains its own isolated context, preventing data leaks across concurrent requests.

---

## Key Features

- **Framework Agnostic:** First-class support for Express, Fastify, NestJS, Koa, and native `node:http`.
- **Zero Heavy Dependencies:** Relies on native Node.js `AsyncLocalStorage`.
- **Strictly Typed:** Full TypeScript generics support for user-defined context schemas.
- **Context Isolation:** Safe boundary isolation preventing leakage across concurrent requests.
- **Convenient Utilities:** Includes `getOrThrow()`, `get()`, `set()`, and function binding helpers (`bind()`).
- **Cross-Process Propagation:** Helpers for serializing context to outbound HTTP headers and message queues.

---

## Installation

```bash
npm install @ahmedyassin/node-request-context
```

*Requires Node.js 20.0.0 or later.*

---

## Quick Start

### 1. Define Context Schema (TypeScript)

Define an interface representing your application's request context:

```typescript
export interface AppContext {
    requestId: string;
    correlationId?: string;
    userId?: string;
    tenantId?: string;
}
```

### 2. Choose: Shared Singleton or Custom Instance

You can use the built-in default singleton or instantiate your own:

```typescript
// Option A: Custom typed instance
import { RequestContext } from "@ahmedyassin/node-request-context";

export const context = new RequestContext<AppContext>();

// Option B: Or use the pre-configured default singleton
// import { defaultContext } from "node-request-context";
```

### 3. Initialize Context in Middleware

Run the asynchronous execution tree inside `context.run`:

```typescript
import { randomUUID } from "node:crypto";
import { context } from "./context";

context.run(
    {
        requestId: randomUUID(),
        userId: "user_456"
    },
    async () => {
        await processOrder();
    }
);
```

### 4. Access Context Anywhere

```typescript
import { context } from "./context";

export function processOrder() {
    // 1. Safe optional read
    const current = context.getContext();
    console.log(current?.requestId);

    // 2. Strict read (throws if called outside context)
    const { userId } = context.getOrThrow();

    // 3. Key-based accessor
    const tenantId = context.get("tenantId");
}
```

---

## Web Framework Integrations

### Express Integration

Wrap your middleware stack using `context.run`:

```typescript
import express from "express";
import { randomUUID } from "node:crypto";
import { RequestContext } from "@ahmedyassin/node-request-context";

interface MyContext {
    requestId: string;
    userId?: string;
}

export const context = new RequestContext<MyContext>();
const app = express();

app.use((req, res, next) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();

    // Ensure all downstream handlers run within this context
    context.run({ requestId }, () => {
        // Also attach requestId to response headers
        res.setHeader("x-request-id", requestId);
        next();
    });
});

app.get("/orders", (req, res) => {
    const { requestId } = context.getOrThrow();
    res.json({ status: "ok", requestId });
});

app.listen(3000);
```

### Fastify Integration

In Fastify, use `onRequest` hook:

```typescript
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { context } from "./context";

const fastify = Fastify();

fastify.addHook("onRequest", (request, reply, done) => {
    const requestId = (request.headers["x-request-id"] as string) || randomUUID();

    context.run({ requestId }, done);
});
```

---

## API Reference

### `new RequestContext<T>(options?: ContextOptions)`
Instantiates an isolated context manager backed by `AsyncLocalStorage<T>`.

| Method | Signature | Description |
|---|---|---|
| `run` | `run<R>(store: T, fn: () => R): R` | Runs the function `fn` synchronously or asynchronously within the given context. |
| `getContext` | `getContext(): T \| undefined` | Returns the active context store, or `undefined` if outside an active context. |
| `getOrThrow` | `getOrThrow(errorMessage?: string): T` | Returns the active context or throws a `ContextMissingError` if called outside an active context. |
| `get` | `get<K extends keyof T>(key: K): T[K] \| undefined` | Gets the value of a specific key from the active context. |
| `set` | `set<K extends keyof T>(key: K, value: T[K]): void` | Sets or updates a key on the active context object. |
| `bind` | `bind<F extends (...args: any[]) => any>(fn: F): F` | Binds a function to always execute with the currently active context. |
| `isActive` | `isActive(): boolean` | Returns `true` if an active context is currently established. |

---

## Best Practices & Gotchas

### 1. Memory Safety
`AsyncLocalStorage` holds references until the asynchronous call tree concludes. Avoid storing large request/response bodies or buffers in the context object to prevent excessive memory retention.

### 2. Detached Event Listeners & Callbacks
If you attach listeners to long-lived EventEmitters outside the request context (or in third-party libraries using legacy callback queues), context can occasionally be lost. Use `context.bind(callback)` to explicitly bind the context:

```typescript
const boundCallback = context.bind(() => {
    // Context is preserved here
    console.log(context.get("requestId"));
});

eventEmitter.on("data", boundCallback);
```

### 3. Distributed Tracing & Boundary Crossing
`AsyncLocalStorage` only propagates context within the local Node.js process. When invoking external HTTP APIs or dispatching message queue events (RabbitMQ, Kafka, BullMQ), explicitly serialize context keys into headers/metadata:

```typescript
// Outgoing HTTP Request
await fetch("https://api.internal/service", {
    headers: {
        "x-request-id": context.get("requestId") ?? ""
    }
});
```

---

## Architecture Plan

```text
node-request-context/
├── src/
│   ├── core/
│   │   ├── context-manager.ts   # AsyncLocalStorage wrapper & state accessors
│   │   ├── errors.ts            # ContextMissingError definitions
│   │   └── types.ts             # Generic context schemas & options
│   ├── integrations/
│   │   ├── express.ts           # Express middleware helper
│   │   └── fastify.ts           # Fastify hook helper
│   ├── propagation/
│   │   ├── headers.ts           # Header extraction and injection
│   │   └── serializers.ts       # Job / payload metadata serializer
│   └── index.ts                 # Public exports
├── tests/
│   ├── context-manager.test.ts  # Core functionality tests
│   ├── concurrency.test.ts      # Concurrency & isolation verification
│   └── propagation.test.ts      # Headers and propagation tests
├── package.json
├── tsconfig.json
└── README.md
```

---

## Roadmap

- [x] Core `AsyncLocalStorage` implementation with TypeScript generics.
- [x] Safe `getOrThrow()`, `get()`, `set()`, and `bind()` helper methods.
- [x] Automatic Request ID generation and extraction.
- [x] Context updates and custom metadata support.
- [x] Built-in Express middleware helper (`createExpressMiddleware`).
- [x] Built-in Fastify hook helper (`createFastifyHook`).
- [x] HTTP context headers propagation (`injectContextHeaders`, `extractContextFromHeaders`).
- [x] Background job context serialization (`serializeContext`, `deserializeContext`).
- [x] Comprehensive unit and concurrency isolation tests.
- [ ] NestJS Interceptor and Module export.
- [ ] Pino & Winston logger integrations.
- [ ] Performance benchmarks.

---

## License

[MIT](LICENSE)
