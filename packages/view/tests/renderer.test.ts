import { describe, it, expect, vi } from 'vitest';
import { ViewRenderer } from '../src/renderer.js';
import { GaoViewEngine } from '../src/engine.js';
import { GaoResponse } from '@gao/http';

describe('ViewRenderer', () => {
    it('should render a view using the engine and return an HTML response', async () => {
        const mockEngine = {
            render: vi.fn().mockResolvedValue('<html><body>Hello</body></html>')
        } as unknown as GaoViewEngine;

        const renderer = new ViewRenderer(mockEngine);
        const res = new GaoResponse();

        const response = await renderer.render(res, 'home', { name: 'World' });

        expect(mockEngine.render).toHaveBeenCalledWith('home', { name: 'World' });
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toContain('text/html');

        const body = await response.text();
        expect(body).toBe('<html><body>Hello</body></html>');
    });

    it('should render to string', async () => {
        const mockEngine = {
            render: vi.fn().mockResolvedValue('rendered content')
        } as unknown as GaoViewEngine;

        const renderer = new ViewRenderer(mockEngine);
        const result = await renderer.renderToString('email', { key: 'val' });

        expect(result).toBe('rendered content');
        expect(mockEngine.render).toHaveBeenCalledWith('email', { key: 'val' });
    });
});
