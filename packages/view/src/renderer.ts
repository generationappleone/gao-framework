/**
 * @gao/view — View Renderer
 * 
 * High-level renderer that bridges GaoResponse and GaoViewEngine.
 */

import { GaoResponse } from '@gao/http';
import { GaoViewEngine } from './engine.js';
import type { RenderData } from './types.js';

export class ViewRenderer {
    constructor(private engine: GaoViewEngine) { }

    /**
     * Render a view and return a Response object.
     */
    public async render(res: GaoResponse, viewName: string, data: RenderData = {}): Promise<Response> {
        const html = await this.engine.render(viewName, data);
        return res.html(html);
    }

    /**
     * Render a view to a string (useful for emails or other non-HTTP uses).
     */
    public async renderToString(viewName: string, data: RenderData = {}): Promise<string> {
        return await this.engine.render(viewName, data);
    }
}

/**
 * Extension for GaoResponse to support .render()
 * Since TypeScript class augmentation can be tricky with ES modules, 
 * we might prefer a helper or a subclass for GAO apps.
 */
declare module '@gao/http' {
    interface GaoResponse {
        render(viewName: string, data?: RenderData): Promise<Response>;
    }
}
