/**
 * @gao/core — DI Container
 *
 * Lightweight Inversion of Control container with:
 * - Singleton and transient lifetimes
 * - Circular dependency detection
 * - Type-safe resolution via symbols
 * - Constructor injection via @Inject decorator
 */

import { InternalError } from './errors.js';
import { getInjectTokens, type InjectToken } from './inject.js';
import type { Lifetime, ServiceRegistration } from './types.js';

export class Container {
  private readonly registrations = new Map<symbol | string, ServiceRegistration>();
  private readonly classRegistrations = new Map<new (...args: any[]) => any, ServiceRegistration>();
  private readonly resolving = new Set<symbol | string | Function>();

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
   * Auto-register a class. Uses @Inject metadata on its constructor
   * to resolve dependencies automatically.
   */
  autoRegister<T>(
    ClassRef: new (...args: any[]) => T,
    lifetime: Lifetime = 'singleton',
  ): void {
    this.classRegistrations.set(ClassRef, {
      token: ClassRef.name,
      lifetime,
      factory: () => this.resolveClass(ClassRef),
      instance: undefined,
    });
  }

  /**
   * Resolve a service by its token.
   * @throws InternalError if circular dependency detected or service not found
   */
  resolve<T>(token: symbol | string | (new (...args: any[]) => T)): T {
    // Handle class-based resolution
    if (typeof token === 'function') {
      return this.resolveByClass(token as new (...args: any[]) => T);
    }

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
        .map((t) => (typeof t === 'symbol' ? t.description : typeof t === 'function' ? t.name : t))
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
   * Resolve a class with constructor injection.
   * Reads @Inject metadata to resolve each constructor parameter.
   */
  resolveClass<T>(ClassRef: new (...args: any[]) => T): T {
    // Circular dependency detection for class
    if (this.resolving.has(ClassRef)) {
      const chain = [...this.resolving]
        .map((t) => (typeof t === 'function' ? t.name : typeof t === 'symbol' ? t.description : t))
        .join(' → ');
      throw new InternalError(
        `Circular dependency detected: ${chain} → ${ClassRef.name}. Refactor to break the cycle.`,
      );
    }

    this.resolving.add(ClassRef);
    try {
      const tokens = getInjectTokens(ClassRef);
      const args: unknown[] = [];

      // Resolve each constructor parameter
      for (const [index, token] of [...tokens.entries()].sort(([a], [b]) => a - b)) {
        const resolved = this.resolveToken(token);
        args[index] = resolved;
      }

      return new ClassRef(...args);
    } finally {
      this.resolving.delete(ClassRef);
    }
  }

  /**
   * Resolve a token that can be a string, symbol, or class reference.
   */
  private resolveToken(token: InjectToken): unknown {
    if (typeof token === 'string' || typeof token === 'symbol') {
      return this.resolve(token);
    }
    // Class-based token
    return this.resolveByClass(token);
  }

  /**
   * Resolve by class reference — check classRegistrations first, then try to resolve by class name from regular registrations.
   */
  private resolveByClass<T>(ClassRef: new (...args: any[]) => T): T {
    const classReg = this.classRegistrations.get(ClassRef);
    if (classReg) {
      if (classReg.lifetime === 'singleton' && classReg.instance !== undefined) {
        return classReg.instance as T;
      }
      const instance = this.resolveClass(ClassRef);
      if (classReg.lifetime === 'singleton') {
        classReg.instance = instance;
      }
      return instance;
    }

    // Fallback: try resolving from string registrations using class name
    if (this.registrations.has(ClassRef.name)) {
      return this.resolve<T>(ClassRef.name);
    }

    // Auto-resolve if it has @Inject metadata
    const tokens = getInjectTokens(ClassRef);
    if (tokens.size > 0 || ClassRef.length === 0) {
      return this.resolveClass(ClassRef);
    }

    throw new InternalError(
      `Class ${ClassRef.name} is not registered and cannot be auto-resolved. ` +
      'Register it with container.autoRegister() or use @Inject decorators.',
    );
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
    this.classRegistrations.clear();
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
