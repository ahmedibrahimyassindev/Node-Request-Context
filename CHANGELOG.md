# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-08

### Added
- **Core AsyncLocalStorage wrapper:**
  - `RequestContext<T>` with full TypeScript generics support.
  - Safe context reading methods: `getContext()`, `getStore()`, `getOrThrow()`, `get()`.
  - In-context mutation with `set()`.
  - Context binding helper `bind()` for asynchronous callbacks, EventEmitters, and timers.
  - `isActive()` helper to verify execution state.
  - Pre-configured default singleton `requestContext` / `defaultContext`.
- **Web Framework Integrations:**
  - Express / Connect middleware (`createExpressMiddleware`) with automatic request ID extraction/generation and header reflection.
  - Fastify hook (`createFastifyHook`) for the `onRequest` lifecycle.
  - NestJS middleware helper (`createNestMiddleware`).
- **Structured Logging Integrations:**
  - Pino mixin generator (`createPinoMixin`) with property filtering and target key nesting.
  - Winston transformer formatter (`createWinstonFormat`).
- **Context Propagation:**
  - Case-insensitive incoming header extraction (`extractContextFromHeaders`).
  - Outgoing HTTP header injection (`injectContextHeaders`) for `fetch`, `axios`, etc.
  - W3C TraceContext `traceparent` parsing (`parseW3CTraceparent`) and formatting (`formatW3CTraceparent`).
  - Job queue / worker JSON serialization (`serializeContext`, `deserializeContext`).
- **Testing & Benchmarks:**
  - 25 automated unit and concurrency isolation tests.
  - High-throughput benchmark achieving over 1,000,000 ops/second on Node 24.
- **CI/CD:**
  - GitHub Actions matrix testing on Node 20.x, 22.x, and 24.x across Ubuntu and Windows.
  - Automated npm release workflow with provenance.

