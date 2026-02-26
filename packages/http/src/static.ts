/**
 * @gao/http — Static serve
 *
 * Provides efficient static file serving with directory traversal prevention,
 * strict mime type deduction, and cache headers. Returns a Response object.
 */

import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import type { GaoRequest } from './request.js';
import { GaoResponse } from './response.js';

export interface StaticOptions {
  /** Root directory to serve files from */
  root: string;
  /** Prefix for matching */
  prefix?: string;
  /** Whether to enable streaming vs loaded in-memory buffers. Default true */
  stream?: boolean;
  /** Max cache age. Default 86400 (1 day) */
  maxAge?: number;
  /** Default fallback string if index not found or similar */
  index?: string;
}

const MIME_MAP: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

/**
 * Returns a response containing the static file, or a 404 response if not found.
 */
export async function serveStatic(
  req: GaoRequest,
  options: StaticOptions,
): Promise<Response | null> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return null;
  }

  let pathname = req.url.pathname;

  const prefix = options.prefix || '';
  if (prefix && pathname.startsWith(prefix)) {
    pathname = pathname.substring(prefix.length);
  } else if (prefix && !pathname.startsWith(prefix)) {
    return null;
  }

  if (pathname === '/' || pathname === '') {
    pathname = options.index ?? 'index.html';
  }

  // Path traversal prevention
  const rootPath = resolve(options.root);
  const requestedPath = resolve(join(rootPath, normalize(pathname)));

  if (!requestedPath.startsWith(rootPath)) {
    return new GaoResponse().error(403, 'FORBIDDEN', 'Directory traversal forbidden');
  }

  try {
    const stats = await stat(requestedPath);

    // No directory listing allowed
    if (stats.isDirectory()) {
      return new GaoResponse().error(403, 'FORBIDDEN', 'Directory listing disabled');
    }

    const ext = extname(requestedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const res = new GaoResponse();

    res.status(200);
    res.header('Content-Type', contentType);
    res.header('Content-Length', stats.size.toString());
    res.header('Cache-Control', `public, max-age=${options.maxAge ?? 86400}`);

    // ETag Generation (basic: size + timestamp)
    const etag = `"${stats.size}-${stats.mtimeMs}"`;
    res.header('ETag', etag);

    if (req.header('if-none-match') === etag) {
      return res.empty(); // 304 Not Modified isn't exactly empty, but status overrides
    }

    if (req.method === 'HEAD') {
      return res.build();
    }

    if (options.stream !== false) {
      // using Web Streams API for compatibility with Bun/Web
      const readStream = createReadStream(requestedPath);
      const webStream = new ReadableStream({
        start(controller) {
          readStream.on('data', (chunk) => controller.enqueue(chunk));
          readStream.on('end', () => controller.close());
          readStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          readStream.destroy();
        },
      });
      return res.stream(webStream, contentType);
    } else {
      const buffer = await readFile(requestedPath);
      return new Response(buffer, {
        status: 200,
        headers: res.build().headers,
      });
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return null; // File not found, let outer router handle it (maybe 404)
    }
    throw err;
  }
}
