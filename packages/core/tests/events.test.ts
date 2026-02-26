import { describe, expect, it, vi } from 'vitest';
import { createEventEmitter } from '../src/events.js';

describe('Event System', () => {
  it('should register and dispatch events', async () => {
    const events = createEventEmitter();
    const mockListener = vi.fn();

    events.on('test-event', mockListener);
    await events.emit('test-event', { payload: 123 });

    expect(mockListener).toHaveBeenCalledWith({ payload: 123 });
  });

  it('should deregister events correctly', async () => {
    const events = createEventEmitter();
    const mockListener = vi.fn();

    const sub = events.on('test-event', mockListener);
    sub.unsubscribe();

    await events.emit('test-event', { payload: 123 });
    expect(mockListener).not.toHaveBeenCalled();
  });

  it('should handle "once" subscriptions', async () => {
    const events = createEventEmitter();
    const mockListener = vi.fn();

    events.once('test-once', mockListener);

    await events.emit('test-once', { payload: 1 });
    await events.emit('test-once', { payload: 2 });

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith({ payload: 1 });
  });
});
