/**
 * @gao/http — Server
 *
 * HTTP Server wrapper favoring Bun.serve() with Node.js 'http' fallback.
 */

import * as http from 'node:http';
import * as https from 'node:https';
import { GaoRequest } from './request.js';
import { GaoResponse } from './response.js';

export interface ServerOptions {
  port?: number;
  hostname?: string;
  tls?: {
    key: string;
    cert: string;
  };
  keepAliveTimeout?: number;
  timeout?: number; // In ms, default 30000 (30s)
  maxBodySize?: number; // In bytes, default 1MB = 1048576
}

export type FetchHandler = (req: GaoRequest, res: GaoResponse) => Promise<Response>;

export class Server {
  private nodeServer?: http.Server | https.Server;
  private bunServer?: any;

  constructor(
    private handler: FetchHandler,
    private options: ServerOptions = {},
  ) {
    this.options.port = this.options.port || 3000;
    this.options.hostname = this.options.hostname || '0.0.0.0';
    this.options.timeout = this.options.timeout || 30000;
  }

  private wrapHandlerWithTimeout(req: GaoRequest, res: GaoResponse): Promise<Response> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const timeoutPromise = new Promise<Response>((_, rj) => {
        timeoutId = setTimeout(() => {
          rj(new Error('REQUEST_TIMEOUT'));
        }, this.options.timeout);
      });

      Promise.race([this.handler(req, res), timeoutPromise])
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.message === 'REQUEST_TIMEOUT') {
            resolve(res.error(408, 'REQUEST_TIMEOUT', 'Request Timeout'));
          } else {
            reject(err);
          }
        });
    });
  }

  public async listen(): Promise<void> {
    if (typeof globalThis.Bun !== 'undefined') {
      await this.listenBun();
    } else {
      await this.listenNode();
    }
  }

  private async listenBun(): Promise<void> {
    // @ts-ignore
    this.bunServer = globalThis.Bun.serve({
      port: this.options.port,
      hostname: this.options.hostname,
      tls: this.options.tls,
      fetch: async (req: Request) => {
        const gaoReq = new GaoRequest(req);
        const gaoRes = new GaoResponse();
        return this.wrapHandlerWithTimeout(gaoReq, gaoRes);
      },
    });
    console.log(`[Bun] Server actively listening on ${this.options.hostname}:${this.options.port}`);
  }

  private async listenNode(): Promise<void> {
    const handleReq = async (req: http.IncomingMessage, res: http.ServerResponse) => {
      // Convert Node req to Web Request
      const protocol = this.options.tls ? 'https' : 'http';
      const host = req.headers.host || `${this.options.hostname}:${this.options.port}`;
      const url = new URL(req.url || '/', `${protocol}://${host}`);

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else if (value) {
          headers.append(key, value);
        }
      }

      const reqInit: RequestInit = {
        method: req.method,
        headers,
      };

      // Only add body for methods that allow it
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const maxSize = this.options.maxBodySize || 1048576; // Default 1MB
        let currentSize = 0;
        const buffers: Buffer[] = [];
        let rejected = false;

        for await (const chunk of req) {
          currentSize += chunk.length;
          if (currentSize > maxSize) {
            rejected = true;
            req.destroy();
            res.statusCode = 413;
            res.end('Payload Too Large');
            return;
          }
          buffers.push(chunk);
        }

        if (!rejected) {
          reqInit.body = Buffer.concat(buffers);
        }
      }
      const webReq = new Request(url, reqInit);
      const gaoReq = new GaoRequest(webReq, req.socket.remoteAddress);
      const gaoRes = new GaoResponse();

      try {
        const response = await this.wrapHandlerWithTimeout(gaoReq, gaoRes);

        res.statusCode = response.status;
        response.headers.forEach((val, key) => {
          res.setHeader(key, val);
        });

        if (response.body) {
          // For Web Streams, iterate and send.
          // To keep Node.js fallback simple for tests, read arrayBuffer
          const arrayBuffer = await response.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } else {
          res.end();
        }
      } catch (error) {
        console.error(error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    };

    if (this.options.tls) {
      this.nodeServer = https.createServer(this.options.tls, handleReq);
    } else {
      this.nodeServer = http.createServer(handleReq);
    }

    if (this.options.keepAliveTimeout) {
      this.nodeServer.keepAliveTimeout = this.options.keepAliveTimeout;
    }

    return new Promise((resolve) => {
      this.nodeServer!.listen(this.options.port, this.options.hostname, () => {
        console.log(
          `[Node] Server actively listening on ${this.options.hostname}:${this.options.port}`,
        );
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.bunServer) {
      this.bunServer.stop(true);
    }

    if (this.nodeServer) {
      return new Promise((resolve, reject) => {
        this.nodeServer!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

// Add Bun global type for TypeScript to pass checks softly
declare global {
  var Bun: any;
}
