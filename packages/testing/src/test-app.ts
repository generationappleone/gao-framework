import { GaoApplication, type ConfigLoaderOptions } from '@gao/core';

export interface TestAppOptions {
    /**
     * Override specific configuration values for the test app
     */
    configOverride?: Record<string, any>;
    /**
     * Disable security middleware that might interfere with testing
     * (e.g. rate limiting, csrf). default: true
     */
    disableSecurityFeatures?: boolean;
}

/**
 * Creates a pre-configured GaoApplication instance for testing.
 * Sets the environment to 'test' and uses an in-memory SQLite database by default.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<GaoApplication> {
    const app = new GaoApplication();

    const disableSecurity = options.disableSecurityFeatures ?? true;

    const testConfig: Record<string, any> = {
        app: {
            name: 'Gao Test App',
            environment: 'test',
            debug: false,
            port: 1, // Use valid minimum port for testing
        },
        database: {
            driver: 'sqlite',
            url: ':memory:',
        },
        security: {
            cors: { enabled: false },
            csrf: { enabled: !disableSecurity },
            rateLimit: { enabled: !disableSecurity },
            ddos: { enabled: false }, // Usually disabled for tests
        }
    };

    // Merge overrides
    if (options.configOverride) {
        for (const [key, value] of Object.entries(options.configOverride)) {
            testConfig[key] = { ...testConfig[key], ...value };
        }
    }

    // Define a custom config loader option to pass our test configuration
    const configOptions: ConfigLoaderOptions = {
        overrides: testConfig,
    };

    await app.boot(configOptions);

    return app;
}
