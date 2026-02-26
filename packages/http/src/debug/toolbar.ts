/**
 * @gao/http — Developer Debug Toolbar Middleware
 */

import type { NextFunction } from '../middleware.js';
import type { GaoRequest } from '../request.js';
import type { GaoResponse } from '../response.js';

export interface DebugToolbarOptions {
  enabled?: boolean;
}

/**
 * Injects a small HTML snippet into HTML responses in development mode.
 * The snippet would typically load an external script or render a UI overlay
 * containing request timings, memory usage, and queries.
 */
export function debugToolbar(options: DebugToolbarOptions = {}) {
  const enabled = options.enabled ?? process.env.NODE_ENV === 'development';

  return async (
    req: GaoRequest,
    _res: GaoResponse,
    next: NextFunction,
  ): Promise<Response | void> => {
    if (!enabled) return next();

    const start = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const response = await next();
    if (!response) return;

    const duration = performance.now() - start;
    const memoryDelta = process.memoryUsage().heapUsed - startMemory;

    // Add Server-Timing headers to any response
    const newHeaders = new Headers(response.headers);
    newHeaders.append('Server-Timing', `total;dur=${duration.toFixed(2)}`);

    // Only inject toolbar HTML on HTML pages
    const isHtml = response.headers.get('content-type')?.includes('text/html');

    if (isHtml) {
      let bodyText = await response.text();

      const toolbarHtml = `
            <!-- GAO Debug Toolbar -->
            <div id="gao-debug-toolbar" style="position: fixed; bottom: 0; left: 0; width: 100%; height: 30px; background: #222; color: #0f0; z-index: 99999; font-family: monospace; display: flex; align-items: center; padding: 0 10px; font-size: 12px; border-top: 1px solid #444;">
                <b style="color:#fff; margin-right:15px;">GAO Dev</b>
                <span>Time: ${duration.toFixed(2)}ms</span>
                <span style="margin-left:15px;">Mem Delta: ${(memoryDelta / 1024).toFixed(2)}KB</span>
                <span style="margin-left:15px;">Path: ${req.url.pathname}</span>
            </div>`;

      if (bodyText.includes('</body>')) {
        bodyText = bodyText.replace('</body>', `${toolbarHtml}</body>`);
      } else {
        bodyText += toolbarHtml;
      }

      return new Response(bodyText, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
