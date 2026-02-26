/**
 * @gao/security — CAPTCHA Integration
 *
 * Server-side verification for Cloudflare Turnstile and Google reCAPTCHA v3.
 * Can be used as middleware to protect endpoints like login/register.
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { ForbiddenError } from '@gao/core';

export interface CaptchaProvider {
  /** Name of the provider */
  name: string;
  /** Verify the token against the provider API */
  verify(token: string, ip?: string): Promise<boolean>;
}

export interface CaptchaOptions {
  /** The configured CAPTCHA provider instance */
  provider: CaptchaProvider;
  /** Property name in the request body containing the token. Default: 'cf-turnstile-response' (Turnstile) or 'g-recaptcha-response' (reCAPTCHA) */
  tokenField?: string;
  /** Error message to return if validation fails. */
  failureMessage?: string;
  /** Function to extract IP address. Needed for some providers. */
  getIp?: (ctx: GaoContext) => string;
}

/**
 * Cloudflare Turnstile verification adapter
 */
export class TurnstileProvider implements CaptchaProvider {
  name = 'turnstile';
  private siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private secretKey: string) {
    if (!secretKey) throw new Error('Turnstile secret key is required');
  }

  async verify(token: string, ip?: string): Promise<boolean> {
    try {
      const body = new URLSearchParams();
      body.append('secret', this.secretKey);
      body.append('response', token);
      if (ip) body.append('remoteip', ip);

      const response = await fetch(this.siteverifyUrl, {
        method: 'POST',
        body,
      });

      const data = (await response.json()) as { success: boolean };
      return data.success === true;
    } catch (e) {
      return false; // Fail-closed on verification errors
    }
  }
}

/**
 * Google reCAPTCHA v3 verification adapter
 */
export class RecaptchaV3Provider implements CaptchaProvider {
  name = 'recaptcha-v3';
  private siteverifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  /**
   * @param secretKey The server-side secret key
   * @param minScore Minimum acceptable score from 0.0 to 1.0 (default 0.5)
   */
  constructor(
    private secretKey: string,
    private minScore = 0.5,
  ) {
    if (!secretKey) throw new Error('reCAPTCHA secret key is required');
  }

  async verify(token: string, ip?: string): Promise<boolean> {
    try {
      const body = new URLSearchParams();
      body.append('secret', this.secretKey);
      body.append('response', token);
      if (ip) body.append('remoteip', ip);

      const response = await fetch(this.siteverifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const data = (await response.json()) as { success: boolean; score?: number };

      // ReCAPTCHA v3 specific: check the score
      if (data.success && typeof data.score === 'number') {
        return data.score >= this.minScore;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}

/**
 * CAPTCHA Shield Middleware.
 * Automatically verifies a CAPTCHA token submitted in the request body.
 */
export function captchaShield(options: CaptchaOptions): Middleware {
  const tokenField =
    options.tokenField ??
    (options.provider.name === 'turnstile' ? 'cf-turnstile-response' : 'g-recaptcha-response');
  const failureMessage = options.failureMessage ?? 'CAPTCHA verification failed';
  const getIp =
    options.getIp ?? ((ctx) => (ctx.metadata.request as { ip?: string })?.ip ?? 'unknown');

  return {
    name: 'security:captcha-shield',
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Standard workflow function
    handle: async (ctx: GaoContext, next: NextFunction) => {
      const request = ctx.metadata.request as { body?: Record<string, unknown> } | undefined;
      const body = request?.body;

      if (!body) throw new ForbiddenError(failureMessage);

      let token = body[tokenField];
      // Sometimes it's structured natively or passed uniquely
      if (Array.isArray(token)) token = token[0];

      if (!token || typeof token !== 'string') {
        throw new ForbiddenError(failureMessage);
      }

      const ip = getIp(ctx);
      const isValid = await options.provider.verify(token, ip);

      if (!isValid) {
        throw new ForbiddenError(failureMessage);
      }

      await next();
    },
  };
}
