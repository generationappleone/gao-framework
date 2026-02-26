import { defineConfig } from '@gao/core';

export default defineConfig({
    app: {
        name: 'GAO Basic API Example',
        port: 3000,
        environment: 'development',
        debug: true
    },
    database: {
        driver: 'sqlite',
        options: { filename: 'example.db' }
    },
    security: {
        cors: { enabled: true },
        rateLimit: { enabled: true, max: 100 }
    }
});
