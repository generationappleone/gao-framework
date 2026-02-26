/**
 * @gao/http — GaoRequest
 *
 * A framework-specific wrapper around the standard Web API Request object.
 * Provides easy access to query parameters, routing params, parsed body,
 * custom headers like Correlation-ID, IP address, and user context.
 */

import { randomUUID } from 'node:crypto';

export class GaoRequest<
  B = any,
  Q extends Record<string, string> = any,
  P extends Record<string, string> = any,
> {
  public readonly native: Request;

  public readonly method: string;
  public readonly url: URL;
  public readonly ip: string;
  public readonly correlationId: string;

  // Parsed data
  public body: B = {} as B;
  public query: Q = {} as Q;
  public params: P = {} as P;

  // User Context (to be populated by auth middlewares)
  public user?: any;

  constructor(req: Request, clientIp = '127.0.0.1') {
    this.native = req;
    this.method = req.method;
    this.url = new URL(req.url);

    // Extract IP (using provided, checking headers fallback if needed, like X-Forwarded-For)
    const forwarded = req.headers.get('x-forwarded-for');
    this.ip = forwarded ? forwarded.split(',')[0]!.trim() : clientIp;

    // Correlation ID
    this.correlationId = req.headers.get('x-correlation-id') || randomUUID();

    // Parse query params into a simple object
    const q: Record<string, string> = {};
    for (const [key, value] of this.url.searchParams.entries()) {
      q[key] = value;
    }
    this.query = q as unknown as Q;
  }

  /**
   * Initializes the request body parsing.
   * Call this before accessing `req.body` if parsing is required.
   */
  public async parseBody(): Promise<void> {
    if (this.method === 'GET' || this.method === 'HEAD') {
      return; // No body
    }

    const contentType = this.native.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        this.body = await this.native.clone().json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await this.native.clone().text();
        const searchParams = new URLSearchParams(text);
        const formData: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
          formData[key] = value;
        }
        this.body = formData as unknown as B;
      } else if (contentType.includes('multipart/form-data')) {
        // Return Native FormData object as the body, user can iterate easily
        this.body = (await this.native.clone().formData()) as unknown as B;
      } else {
        // Fallback to text
        this.body = (await this.native.clone().text()) as unknown as B;
      }
    } catch (e) {
      // Unparseable body
      this.body = {} as B;
    }
  }

  /**
   * Helper to get a specific header.
   */
  public header(name: string): string | null {
    return this.native.headers.get(name);
  }
}
