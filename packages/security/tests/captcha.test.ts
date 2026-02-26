import { ForbiddenError } from '@gao/core';
import type { GaoContext } from '@gao/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RecaptchaV3Provider,
  TurnstileProvider,
  captchaShield,
} from '../src/middleware/captcha.js';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('CAPTCHA Middleware', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('Turnstile: should approve valid token', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ success: true }),
    });

    const provider = new TurnstileProvider('secret');
    const middleware = captchaShield({ provider });

    const ctx = {
      metadata: {
        request: { body: { 'cf-turnstile-response': 'valid_token' } },
      },
    } as unknown as GaoContext;

    const next = vi.fn();
    await middleware.handle(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.anything(),
    );
  });

  it('Turnstile: should throw on invalid token', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ success: false }),
    });

    const provider = new TurnstileProvider('secret');
    const middleware = captchaShield({ provider });

    // Missing token
    const ctxMissing = { metadata: { request: { body: {} } } } as unknown as GaoContext;
    await expect(middleware.handle(ctxMissing, vi.fn())).rejects.toThrow(ForbiddenError);

    // Invalid token
    const ctxInvalid = {
      metadata: { request: { body: { 'cf-turnstile-response': 'invalid' } } },
    } as unknown as GaoContext;
    await expect(middleware.handle(ctxInvalid, vi.fn())).rejects.toThrow(ForbiddenError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ReCAPTCHA v3: should approve high score', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ success: true, score: 0.9 }),
    });

    const provider = new RecaptchaV3Provider('secret', 0.5);
    const middleware = captchaShield({ provider });

    const ctx = {
      metadata: {
        request: { body: { 'g-recaptcha-response': 'valid_token' } },
      },
    } as unknown as GaoContext;

    const next = vi.fn();
    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ReCAPTCHA v3: should reject low score', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ success: true, score: 0.2 }),
    });

    const provider = new RecaptchaV3Provider('secret', 0.5); // min score is 0.5
    const middleware = captchaShield({ provider });

    const ctx = {
      metadata: {
        request: { body: { 'g-recaptcha-response': 'valid_token' } },
      },
    } as unknown as GaoContext;

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow('CAPTCHA verification failed');
  });
});
