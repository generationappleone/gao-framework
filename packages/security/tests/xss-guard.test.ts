import type { GaoContext } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import {
  generateCspNonce,
  htmlEncode,
  sanitizeHtml,
  xssGuard,
} from '../src/middleware/xss-guard.js';

describe('XSS Guard Utilities', () => {
  it('should encode HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const encoded = htmlEncode(input);
    expect(encoded).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    expect(encoded).not.toContain('<script>');
  });

  it('should sanitize dangerous HTML server-side', async () => {
    const dirty = '<p>Good text</p><script>alert("bad")</script><img onerror="bad()" />';
    const clean = await sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('Good text');
  });

  it('should allow only whitelisted tags', async () => {
    const content = '<b>Bold</b> <i>Italic</i> <span>Other</span>';
    const clean = await sanitizeHtml(content, ['b', 'i']);
    expect(clean).toContain('<b>Bold</b>');
    expect(clean).not.toContain('<span>');
  });

  it('should generate CSP nonces that are base64url strings', () => {
    const nonce = generateCspNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(nonce.length).toBeGreaterThan(8);
  });
});

describe('XSS Guard Middleware', () => {
  it('should inject CSP nonce into context', async () => {
    const middleware = xssGuard({ injectCspNonce: true });
    const ctx = {
      metadata: {
        responseHeaders: {
          'Content-Security-Policy': "default-src 'self'; script-src 'self'",
        },
      },
    } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    const nonce = ctx.metadata.cspNonce;
    expect(nonce).toBeTruthy();
    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['Content-Security-Policy']).toContain(`'nonce-${nonce}'`);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should sanitize body strings if enabled', async () => {
    const middleware = xssGuard({ sanitizeBody: true });
    const ctx = {
      metadata: {
        request: {
          body: {
            name: 'John',
            bio: '<p>Hello</p><script>alert(1)</script>',
          },
        },
      },
    } as unknown as GaoContext;

    await middleware.handle(ctx, vi.fn());

    const body = (ctx.metadata.request as { body: Record<string, unknown> }).body;
    expect(body.name).toBe('John');
    expect(body.bio).not.toContain('<script>');
    expect(body.bio).toContain('Hello');
  });
});
