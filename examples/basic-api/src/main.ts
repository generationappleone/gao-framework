import { createApp } from '@gao/core';
import { GaoResponse } from '@gao/http';

async function main() {
    const app = createApp();

    // Simple Inline Route
    app.router.get('/', (req, res: GaoResponse) => {
        return res.json({
            message: 'Welcome to the GAO Basic API Example',
            docs: '/docs'
        });
    });

    // Health check
    app.router.get('/health', (req, res: GaoResponse) => {
        return res.json({ status: 'OK', uptime: process.uptime() });
    });

    await app.boot();
    console.log(`GAO Example App running at http://localhost:${app.config.app.port}`);
}

main().catch(console.error);
