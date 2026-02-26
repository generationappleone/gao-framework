/**
 * @gao/http — Response Compression Middleware
 *
 * Auto-detects `Accept-Encoding` header and compresses the response.
 * Uses Gzip, Deflate, or Brotli. Enforces a threshold to avoid compressing small payloads.
 */

import { promisify } from 'node:util';
import zlib from 'node:zlib';
import type { NextFunction } from './middleware.js';
import type { GaoRequest } from './request.js';
import type { GaoResponse } from './response.js';

const gzipAsync = promisify(zlib.gzip);
const brotliAsync = promisify(zlib.brotliCompress);
const deflateAsync = promisify(zlib.deflate);

export interface CompressionOptions {
  /** Minimum length (in bytes) to apply compression. Default 1024 bytes */
  threshold?: number;
  /** Disable completely */
  disable?: boolean;
}

export function compression(options: CompressionOptions = {}) {
  const threshold = options.threshold ?? 1024;

  return async (
    req: GaoRequest,
    _res: GaoResponse,
    next: NextFunction,
  ): Promise<Response | void> => {
    if (options.disable) return next();

    // 1. Run the rest of the onion first so we have the final Response object
    const response = await next();
    if (!response) return;

    // 2. See if response satisfies conditions to be compressed
    const acceptEncoding = req.native.headers.get('accept-encoding') || '';

    // Cannot compress stream/blob easily in a middleware intercept if it's already piped
    // For simplicity in Node.js wrapper, we compress if it's a string or ArrayBuffer body that was intercepted.
    // Fast paths: clone response and read ArrayBuffer if small.
    const resBody = response.body;
    if (!resBody) return response;

    // 3. Clone to inspect size
    const clone = response.clone();
    const arrayBuffer = await clone.arrayBuffer();

    if (arrayBuffer.byteLength < threshold) return response;

    const buffer = Buffer.from(arrayBuffer);
    let compressedBuffer: Buffer;

    const newHeaders = new Headers(response.headers);
    const encoding = extractBestEncoding(acceptEncoding);

    switch (encoding) {
      case 'br':
        compressedBuffer = await brotliAsync(buffer);
        newHeaders.set('Content-Encoding', 'br');
        break;
      case 'gzip':
        compressedBuffer = await gzipAsync(buffer);
        newHeaders.set('Content-Encoding', 'gzip');
        break;
      case 'deflate':
        compressedBuffer = await deflateAsync(buffer);
        newHeaders.set('Content-Encoding', 'deflate');
        break;
      default:
        // No supported encoding requested
        return response;
    }

    // 4. Update Headers
    newHeaders.delete('Content-Length');
    newHeaders.set('Content-Length', compressedBuffer.length.toString());
    newHeaders.append('Vary', 'Accept-Encoding');

    // 5. Return new Response
    return new Response(new Uint8Array(compressedBuffer), {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

function extractBestEncoding(acceptEncoding: string): string | null {
  if (acceptEncoding.includes('br')) return 'br';
  if (acceptEncoding.includes('gzip')) return 'gzip';
  if (acceptEncoding.includes('deflate')) return 'deflate';
  return null;
}
