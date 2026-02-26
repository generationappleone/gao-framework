import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../src/errors.js';
import { createRouter } from '../src/router.js';

describe('Router', () => {
  it('should route static paths correctly', () => {
    const router = createRouter();
    const handler = () => 'ok';
    router.get('/hello', handler);

    const match = router.match('GET', '/hello');
    expect(match.handler).toBe(handler);
    expect(match.params).toEqual({});
  });

  it('should route parametric paths correctly', () => {
    const router = createRouter();
    const handler = () => 'ok';
    router.get('/users/:id', handler);

    const match = router.match('GET', '/users/123');
    expect(match.handler).toBe(handler);
    expect(match.params).toEqual({ id: '123' });
  });

  it('should throw NotFoundError for missing routes', () => {
    const router = createRouter();
    expect(() => router.match('GET', '/not-found')).toThrow(NotFoundError);
  });

  it('should support route grouping', () => {
    const router = createRouter();
    const handler = () => 'ok';

    router.group('/api', (r) => {
      r.get('/users', handler);
    });

    const match = router.match('GET', '/api/users');
    expect(match.handler).toBe(handler);
  });

  it('should generate URLs from named routes', () => {
    const router = createRouter();
    router.get('/users/:id/posts/:postId', () => {}, { name: 'user.post' });

    expect(router.url('user.post', { id: '1', postId: '42' })).toBe('/users/1/posts/42');
  });
});
