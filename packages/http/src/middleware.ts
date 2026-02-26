/**
 * @gao/http — Middleware Pipeline
 *
 * Onion-style middleware execution pipeline handling asynchronous execution
 * and allowing short-circuiting by returning a Response early.
 */

import type { GaoRequest } from './request.js';
import type { GaoResponse } from './response.js';

export type NextFunction = () => Promise<Response | void>;

export type MiddlewareHandler = (
  req: GaoRequest,
  res: GaoResponse,
  next: NextFunction,
) => Promise<Response | void> | Response | void;

export class MiddlewarePipeline {
  private middlewares: MiddlewareHandler[] = [];

  /**
   * Add a middleware to the pipeline.
   */
  public use(handler: MiddlewareHandler): this {
    this.middlewares.push(handler);
    return this;
  }

  /**
   * Executes the pipeline.
   * The `finalHandler` is executed at the center of the onion.
   */
  public async execute(
    req: GaoRequest,
    res: GaoResponse,
    finalHandler: (req: GaoRequest, res: GaoResponse) => Promise<Response | void> | Response | void,
  ): Promise<Response> {
    let index = -1;

    const dispatch = async (i: number): Promise<Response | void> => {
      if (i <= index) {
        throw new Error('next() called multiple times within a single middleware element');
      }
      index = i;

      if (i === this.middlewares.length) {
        return finalHandler(req, res);
      }

      const handler = this.middlewares[i];

      if (!handler) {
        return finalHandler(req, res);
      }

      // Bind next function to proceed to the next index
      const next: NextFunction = async () => dispatch(i + 1);

      return handler(req, res, next);
    };

    // Start execution
    let result: Response | void;
    try {
      result = await dispatch(0);
    } catch (error) {
      // Unhandled errors will bubble up. The server/error wrapper should catch these.
      throw error;
    }

    // If a middleware intercept finalResponse but did not return anything explicitly,
    // we default to returning the built Response inside GaoResponse builder
    if (result instanceof Response) {
      return result;
    }

    return res.build();
  }
}
