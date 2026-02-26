/**
 * @gao/view — Asset Pipeline
 * 
 * Handles asset path resolution and fingerprinting.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export interface AssetOptions {
    publicPath: string;
    manifestPath?: string;
    isDev?: boolean;
}

export class AssetPipeline {
    private manifest: Record<string, string> = {};

    constructor(private options: AssetOptions) {
        this.loadManifest();
    }

    private loadManifest() {
        if (!this.options.isDev && this.options.manifestPath && fs.existsSync(this.options.manifestPath)) {
            try {
                const content = fs.readFileSync(this.options.manifestPath, 'utf8');
                this.manifest = JSON.parse(content);
            } catch (e) {
                console.warn('Failed to load asset manifest:', e);
            }
        }
    }

    /**
     * Resolve an asset path.
     */
    public resolve(assetPath: string): string {
        // 1. Check manifest first in production
        if (!this.options.isDev && this.manifest[assetPath]) {
            return this.manifest[assetPath];
        }

        // 2. In dev or if not in manifest, return as is (maybe with a dynamic hash if requested)
        return `/${assetPath.replace(/^\//, '')}`;
    }

    /**
     * Helper to generate a fingerprint for a file.
     */
    public getFingerprint(filePath: string): string {
        const fullPath = path.resolve(this.options.publicPath, filePath);
        if (!fs.existsSync(fullPath)) return '';

        const content = fs.readFileSync(fullPath);
        return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
    }
}
