/**
 * @gao/core — Event System
 *
 * Typed event emitter for decoupling services:
 * - emit(), on(), once(), off()
 * - Async listeners supported
 * - Type-safe event payloads
 */

import type { EventListener, EventSubscription } from './types.js';

export class EventEmitter {
  private readonly listeners = new Map<string, Set<EventListener>>();

  /**
   * Subscribe to an event. Returns an unsubscribe handle.
   */
  on<T = unknown>(event: string, listener: EventListener<T>): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const listenersSet = this.listeners.get(event);
    listenersSet?.add(listener as EventListener);

    return {
      unsubscribe: () => {
        listenersSet?.delete(listener as EventListener);
      },
    };
  }

  /**
   * Subscribe to an event — fires once then auto-unsubscribes.
   */
  once<T = unknown>(event: string, listener: EventListener<T>): EventSubscription {
    const wrappedListener: EventListener<T> = async (payload: T) => {
      subscription.unsubscribe();
      await listener(payload);
    };
    const subscription = this.on(event, wrappedListener);
    return subscription;
  }

  /**
   * Remove a specific listener from an event.
   */
  off<T = unknown>(event: string, listener: EventListener<T>): void {
    this.listeners.get(event)?.delete(listener as EventListener);
  }

  /**
   * Emit an event to all listeners. Async listeners are awaited.
   */
  async emit<T = unknown>(event: string, payload: T): Promise<void> {
    const listenersSet = this.listeners.get(event);
    if (!listenersSet || listenersSet.size === 0) return;

    const promises: Promise<void>[] = [];
    for (const listener of listenersSet) {
      const result = listener(payload);
      if (result instanceof Promise) {
        promises.push(result);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Remove all listeners for a specific event, or all events.
   */
  removeAll(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for a specific event.
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all registered event names.
   */
  eventNames(): string[] {
    return [...this.listeners.keys()];
  }
}

export function createEventEmitter(): EventEmitter {
  return new EventEmitter();
}
