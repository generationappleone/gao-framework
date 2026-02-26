/**
 * @gao/core — DI Container
 *
 * Lightweight Inversion of Control container with:
 * - Singleton and transient lifetimes
 * - Circular dependency detection
 * - Type-safe resolution via symbols
 */

import { InternalError } from './errors.js';
import type { Lifetime, ServiceRegistration } from './types.js';

export class Container {
  private readonly registrations = new Map<symbol | string, ServiceRegistration>();
  private readonly resolving = new Set<symbol | string>();

  /**
   * Register a service factory with a specific lifetime.
   */
  register<T>(token: symbol | string, factory: () => T, lifetime: Lifetime = 'singleton'): void {
    this.registrations.set(token, {
      token,
      lifetime,
      factory,
      instance: undefined,
    });
  }

  /**
   * Register a singleton service (created once, shared).
   */
  singleton<T>(token: symbol | string, factory: () => T): void {
    this.register(token, factory, 'singleton');
  }

  /**
   * Register a transient service (new instance each resolution).
   */
  transient<T>(token: symbol | string, factory: () => T): void {
    this.register(token, factory, 'transient');
  }

  /**
   * Register an already-created instance as a singleton.
   */
  instance<T>(token: symbol | string, value: T): void {
    this.registrations.set(token, {
      token,
      lifetime: 'singleton',
      factory: () => value,
      instance: value,
    });
  }

  /**
   * Resolve a service by its token.
   * @throws InternalError if circular dependency detected or service not found
   */
  resolve<T>(token: symbol | string): T {
    const registration = this.registrations.get(token);

    if (!registration) {
      const tokenName = typeof token === 'symbol' ? token.description : token;
      throw new InternalError(
        `Service not registered: ${tokenName ?? 'unknown'}. Did you forget to register it in the container?`,
      );
    }

    // Circular dependency detection
    if (this.resolving.has(token)) {
      const tokenName = typeof token === 'symbol' ? token.description : token;
      const chain = [...this.resolving]
        .map((t) => (typeof t === 'symbol' ? t.description : t))
        .join(' → ');
      throw new InternalError(
        `Circular dependency detected: ${chain} → ${tokenName ?? 'unknown'}. Refactor to break the cycle.`,
      );
    }

    // Return existing singleton instance
    if (registration.lifetime === 'singleton' && registration.instance !== undefined) {
      return registration.instance as T;
    }

    // Resolve with circular dependency tracking
    this.resolving.add(token);
    try {
      const instance = registration.factory() as T;

      if (registration.lifetime === 'singleton') {
        registration.instance = instance;
      }

      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * Check if a service is registered.
   */
  has(token: symbol | string): boolean {
    return this.registrations.has(token);
  }

  /**
   * Remove a service registration.
   */
  unregister(token: symbol | string): boolean {
    return this.registrations.delete(token);
  }

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    this.registrations.clear();
    this.resolving.clear();
  }

  /**
   * Get all registered tokens (for debugging).
   */
  get tokens(): ReadonlyArray<symbol | string> {
    return [...this.registrations.keys()];
  }
}

/**
 * Create a new DI container instance.
 */
export function createContainer(): Container {
  return new Container();
}
