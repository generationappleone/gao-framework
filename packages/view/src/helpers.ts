/**
 * @gao/view — View Helpers
 * 
 * Standard helpers available in all templates.
 */

import { AssetPipeline } from './assets.js';

export interface HelperOptions {
    assetPipeline?: AssetPipeline;
    baseUrl?: string;
    csrfToken?: string;
    userPermissions?: string[];
}

export class ViewHelpers {
    constructor(private options: HelperOptions = {}) { }

    /**
     * Generate a URL for the given path.
     */
    public url(path: string): string {
        const base = this.options.baseUrl || '';
        return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }

    /**
     * Get the versioned asset path.
     */
    public asset(path: string): string {
        if (this.options.assetPipeline) {
            return this.options.assetPipeline.resolve(path);
        }
        return `/${path.replace(/^\//, '')}`;
    }

    /**
     * Generate a CSRF hidden input field.
     */
    public csrf(): string {
        const token = this.options.csrfToken || '';
        return `<input type="hidden" name="_csrf" value="${token}">`;
    }

    /**
     * Check if user has specific permission.
     */
    public can(permission: string): boolean {
        if (!this.options.userPermissions) return false;
        return this.options.userPermissions.includes(permission);
    }

    /**
     * Helper for form re-population (old value).
     */
    public old(key: string, data: any, defaultValue: any = ''): any {
        if (data && data[key] !== undefined) {
            return data[key];
        }
        return defaultValue;
    }

    /**
     * Generate pagination HTML (simplified).
     */
    public paginate(meta: any): string {
        if (!meta || !meta.totalPages || meta.totalPages <= 1) return '';

        let html = '<nav class="pagination">';
        if (meta.hasPrev) {
            html += `<a href="?page=${meta.page - 1}">Previous</a>`;
        }
        html += `<span>Page ${meta.page} of ${meta.totalPages}</span>`;
        if (meta.hasNext) {
            html += `<a href="?page=${meta.page + 1}">Next</a>`;
        }
        html += '</nav>';
        return html;
    }
}
