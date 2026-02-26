import { describe, it, expect } from 'vitest';
import { GaoViewEngine } from '../src/engine.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewsPath = path.join(__dirname, 'views');

describe('GaoViewEngine', () => {
    const engine = new GaoViewEngine({ viewsPath });

    it('should render simple variables', () => {
        const template = '<h1>Hello ${name}</h1>';
        const fn = engine.compile(template);
        const result = fn({ name: 'GAO' }, { __escape: (s: any) => s });
        expect(result).toBe('<h1>Hello GAO</h1>');
    });

    it('should escape HTML in variables', () => {
        const template = '<p>${bio}</p>';
        const fn = engine.compile(template);
        const result = fn({ bio: '<script>' }, { __escape: (s: any) => '&lt;script&gt;' });
        expect(result).toBe('<p>&lt;script&gt;</p>');
    });

    it('should render with layouts and sections', async () => {
        const result = await engine.render('profile', {
            title: 'User Profile Page',
            user: { name: 'John Doe' }
        });

        expect(result).toContain('<title>User Profile Page</title>');
        expect(result).toContain('<h1>User Profile</h1>');
        expect(result).toContain('Name: John Doe');
        expect(result).toContain('Profile Footer');
    });

    it('should render a view with a partial', async () => {
        const viewContent = 'Result: <@ partial("my-partial", { message: "Partial Content" }) @>';
        const tmpView = path.join(viewsPath, 'tmp-partial.gao');
        fs.writeFileSync(tmpView, viewContent);

        try {
            const result = await engine.render('tmp-partial');
            expect(result).toContain('Partial: Partial Content');
        } finally {
            if (fs.existsSync(tmpView)) fs.unlinkSync(tmpView);
        }
    });

    it('should support unescaped output', () => {
        const template = '<div>!{html}</div>';
        const fn = engine.compile(template);
        const result = fn({ html: '<b>Bold</b>' }, { __escape: (s: any) => s });
        expect(result).toBe('<div><b>Bold</b></div>');
    });
});
