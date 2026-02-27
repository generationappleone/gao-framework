/**
 * @gao/http — GaoResponse
 *
 * Builder pattern for standard Web API Response objects.
 * Allows fluent setting of headers, status, and payload.
 * Also enforces the GAO generic success/error envelope shape.
 */

export interface GaoEnvelope<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

export class GaoResponse {
  private _status = 200;
  private _headers: Headers = new Headers();
  private _body: BodyInit | null = null;

  /**
   * Set the HTTP status code
   */
  public status(code: number): this {
    this._status = code;
    return this;
  }

  /**
   * Add or set an HTTP header
   */
  public header(name: string, value: string): this {
    this._headers.set(name, value);
    return this;
  }

  /**
   * Append to an HTTP header
   */
  public appendHeader(name: string, value: string): this {
    this._headers.append(name, value);
    return this;
  }

  /**
   * Sets the response body to JSON, wrapped in the standard envelope.
   */
  public json<T>(data: T, meta?: Record<string, any>): Response {
    this.header('Content-Type', 'application/json; charset=utf-8');

    const envelope: GaoEnvelope<T> = { data };
    if (meta) {
      envelope.meta = meta;
    }

    this._body = JSON.stringify(envelope);
    return this.build();
  }

  /**
   * Send an error response following the envelope scheme.
   */
  public error(status: number, code: string, message: string, details?: any): Response {
    this.status(status);
    this.header('Content-Type', 'application/json; charset=utf-8');

    const envelope: GaoEnvelope = {
      error: { code, message, details },
    };

    this._body = JSON.stringify(envelope);
    return this.build();
  }

  /**
   * Sends plain text response
   */
  public text(text: string): Response {
    this.header('Content-Type', 'text/plain; charset=utf-8');
    this._body = text;
    return this.build();
  }

  /**
   * Sends a raw HTML response
   */
  public html(html: string): Response {
    this.header('Content-Type', 'text/html; charset=utf-8');
    this._body = html;
    return this.build();
  }

  /**
   * Returns a redirect response
   */
  public redirect(url: string, status = 302): Response {
    this.status(status);
    this.header('Location', url);
    return this.build();
  }

  /**
   * Sends a raw stream response
   */
  public stream(stream: ReadableStream, contentType = 'application/octet-stream'): Response {
    this.header('Content-Type', contentType);
    this._body = stream;
    return this.build();
  }

  /**
   * Return empty response (204 No Content)
   */
  public empty(): Response {
    this.status(204);
    this._body = null;
    return this.build();
  }

  /**
   * Reset the response to its initial state for object pool reuse.
   * Clears status, headers, and body.
   */
  public reset(): void {
    this._status = 200;
    this._headers = new Headers();
    this._body = null;
  }

  /**
   * Constructs the final native Web Request Response object.
   * Normally called internally by terminators like .json(), .html() etc.
   */
  public build(): Response {
    return new Response(this._body, {
      status: this._status,
      headers: this._headers,
    });
  }
}
