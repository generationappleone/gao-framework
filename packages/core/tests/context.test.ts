import { describe, expect, it } from 'vitest';
import {
  getContext,
  getCorrelationId,
  getUserId,
  runWithContext,
  setContextMetadata,
} from '../src/context.js';

describe('Context System', () => {
  it('should isolate context across async execution', async () => {
    const result1 = runWithContext({ correlationId: 'id-1', userId: 'user1' }, async () => {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { corrId: getCorrelationId(), user: getUserId() };
    });

    const result2 = runWithContext({ correlationId: 'id-2', userId: 'user2' }, async () => {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { corrId: getCorrelationId(), user: getUserId() };
    });

    const [r1, r2] = await Promise.all([result1, result2]);

    expect(r1).toEqual({ corrId: 'id-1', user: 'user1' });
    expect(r2).toEqual({ corrId: 'id-2', user: 'user2' });
  });

  it('should update metadata in context', () => {
    runWithContext({ correlationId: 'id-1' }, () => {
      setContextMetadata('foo', 'bar');
      const ctx = getContext();
      expect(ctx?.metadata.foo).toBe('bar');
    });
  });

  it('should return no-context string outside of context', () => {
    expect(getCorrelationId()).toBe('no-context');
  });
});
