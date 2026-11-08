import { AsyncLocalStorage } from "node:async_hooks";
import { ContextMissingError } from "./errors.js";
import type { ContextOptions, ContextStore } from "./types.js";

/**
 * RequestContext manages isolated asynchronous context across execution call trees
 * using Node.js's native AsyncLocalStorage.
 */
export class RequestContext<T extends ContextStore = Record<string, any>> {
  private readonly als: AsyncLocalStorage<T>;
  public readonly name?: string;

  constructor(options: ContextOptions = {}) {
    this.als = new AsyncLocalStorage<T>();
    this.name = options.name;
  }

  /**
   * Executes a synchronous or asynchronous function within a scoped context.
   *
   * @param store The initial context data for this execution scope.
   * @param fn The callback to execute within the context.
   * @returns The return value of the callback.
   */
  public run<R>(store: T, fn: () => R): R {
    return this.als.run(store, fn);
  }

  /**
   * Returns the current context store, or undefined if called outside an active context.
   */
  public getContext(): T | undefined {
    return this.als.getStore();
  }

  /**
   * Alias for getContext() for compatibility with AsyncLocalStorage semantics.
   */
  public getStore(): T | undefined {
    return this.getContext();
  }

  /**
   * Returns the current context or throws ContextMissingError if outside an active context.
   *
   * @param errorMessage Custom error message if context is missing.
   */
  public getOrThrow(errorMessage?: string): T {
    const store = this.getContext();
    if (!store) {
      throw new ContextMissingError(errorMessage);
    }
    return store;
  }

  /**
   * Gets a specific property from the active context store.
   * Returns undefined if context is not active or key does not exist.
   *
   * @param key Property name on context.
   */
  public get<K extends keyof T>(key: K): T[K] | undefined {
    const store = this.getContext();
    return store ? store[key] : undefined;
  }

  /**
   * Sets or updates a property on the active context store.
   * Throws ContextMissingError if called outside an active context.
   *
   * @param key Property name to set.
   * @param value Property value.
   */
  public set<K extends keyof T>(key: K, value: T[K]): void {
    const store = this.getOrThrow();
    store[key] = value;
  }

  /**
   * Returns true if there is an active context in the current execution scope.
   */
  public isActive(): boolean {
    return this.getContext() !== undefined;
  }

  /**
   * Binds a given function to the current active context, ensuring the context
   * is preserved whenever the returned function is called (useful for EventEmitters, timers, etc).
   *
   * @param fn Function to bind to current context.
   */
  public bind<F extends (...args: any[]) => any>(fn: F): F {
    const current = this.getContext();
    if (!current) {
      return fn;
    }

    if (typeof (AsyncLocalStorage as any).bind === "function") {
      return (AsyncLocalStorage as any).bind(fn);
    }

    return ((...args: Parameters<F>): ReturnType<F> => {
      return this.run(current, () => fn(...args));
    }) as F;
  }
}

