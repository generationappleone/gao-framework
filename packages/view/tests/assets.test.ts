import { describe, it, expect } from 'vitest';
import { AssetPipeline } from '../src/assets.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('AssetPipeline', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gao-assets-test-'));
    const publicPath = path.join(tmpDir, 'public');
    fs.mkdirSync(publicPath);

    it('should resolve asset path in dev mode', () => {
        const pipeline = new AssetPipeline({ publicPath, isDev: true });
        expect(pipeline.resolve('js/app.js')).toBe('/js/app.js');
    });

    it('should resolve asset path from manifest in production', () => {
        const manifestPath = path.join(tmpDir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify({ 'js/app.js': '/js/app.12345.js' }));

        const pipeline = new AssetPipeline({ publicPath, manifestPath, isDev: false });
        expect(pipeline.resolve('js/app.js')).toBe('/js/app.12345.js');
    });

    it('should generate fingerprint for a file', () => {
        const pipeline = new AssetPipeline({ publicPath, isDev: true });
        const filePath = 'test.css';
        fs.writeFileSync(path.join(publicPath, filePath), 'body { color: red; }');

        const hash = pipeline.getFingerprint(filePath);
        expect(hash).toHaveLength(8);

        // Change file content
        fs.writeFileSync(path.join(publicPath, filePath), 'body { color: blue; }');
        const newHash = pipeline.getFingerprint(filePath);
        expect(newHash).not.toBe(hash);
    });
});
