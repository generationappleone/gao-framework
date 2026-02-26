/**
 * @gao/core — Config Loader (NO .env)
 *
 * TypeScript-first configuration system:
 * - Loads gao.config.ts as primary config
 * - Loads gao.config.{environment}.ts for env overrides
 * - Validates with Zod schemas
 * - Secrets from process.env (system env vars, NOT .env files)
 * - Immutable after boot (Object.freeze)
 * - defineConfig() helper with full type inference
 */

import { z } from 'zod';
import { InternalError } from './errors.js';
import type { AppConfig, GaoConfig } from './types.js';

/** Default app config schema */
const appConfigSchema = z.object({
  name: z.string().min(1).default('GaoApp'),
  port: z.number().int().min(1).max(65535).default(3000),
  environment: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  debug: z.boolean().default(false),
});

/** Full framework config schema (extensible) */
const gaoConfigSchema = z
  .object({
    app: appConfigSchema.default({}),
  })
  .passthrough();

/**
 * Helper function for type-safe config definition.
 * Used in gao.config.ts files.
 *
 * @example
 * ```ts
 * // gao.config.ts
 * import { defineConfig } from '@gao/core';
 *
 * export default defineConfig({
 *   app: { name: 'MyApp', port: 3000 },
 *   database: { driver: 'postgres', host: 'localhost' },
 * });
 * ```
 */
export function defineConfig<T extends Record<string, unknown>>(
  config: T & { app?: Partial<AppConfig> },
): T & { app: AppConfig } {
  return config as T & { app: AppConfig };
}

export interface ConfigLoaderOptions {
  /** Override environment detection (defaults to process.env.NODE_ENV) */
  readonly environment?: string;
  /** Additional Zod schema to validate custom config fields */
  readonly schema?: z.ZodType;
  /** Directly provide config (skip file loading — used for testing) */
  readonly overrides?: Record<string, unknown>;
}

/**
 * Load and validate framework configuration.
 *
 * Resolution order (last wins):
 * 1. Framework defaults
 * 2. gao.config.ts (user config)
 * 3. gao.config.{env}.ts (environment overrides)
 * 4. process.env.* (system environment variables — NOT .env files)
 * 5. Programmatic overrides (for testing)
 *
 * @returns Frozen, validated GaoConfig
 */
export async function loadConfig(options: ConfigLoaderOptions = {}): Promise<GaoConfig> {
  const environment =
    options.environment ??
    (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined) ??
    'development';

  let rawConfig: Record<string, unknown> = {};

  if (options.overrides) {
    // Direct overrides (testing mode)
    rawConfig = { ...options.overrides };
  } else {
    // Try loading config files dynamically
    rawConfig = await loadConfigFiles(environment);
  }

  // Apply environment variable overrides for common fields
  applyEnvOverrides(rawConfig, environment);

  // Validate with Zod
  const validated = validateConfig(rawConfig, options.schema);

  // Deep freeze to make config immutable
  return deepFreeze(validated) as GaoConfig;
}

/**
 * Load gao.config.ts and gao.config.{env}.ts files.
 */
async function loadConfigFiles(environment: string): Promise<Record<string, unknown>> {
  let baseConfig: Record<string, unknown> = {};

  // Try loading base config
  try {
    const configPath = `${process.cwd()}/gao.config.ts`;
    const imported = await import(configPath);
    baseConfig = imported.default ?? imported;
  } catch {
    // No base config file — use defaults
  }

  // Try loading environment-specific override
  try {
    const envConfigPath = `${process.cwd()}/gao.config.${environment}.ts`;
    const envImported = await import(envConfigPath);
    const envConfig = envImported.default ?? envImported;
    baseConfig = deepMerge(baseConfig, envConfig);
  } catch {
    // No env-specific config — that's fine
  }

  return baseConfig;
}

/**
 * Apply system environment variable overrides (NOT from .env files).
 */
function applyEnvOverrides(config: Record<string, unknown>, environment: string): void {
  const env = typeof process !== 'undefined' ? process.env : {};

  // Ensure app section exists
  if (!config.app || typeof config.app !== 'object') {
    config.app = {};
  }

  const appConfig = config.app as Record<string, unknown>;

  // Override from system env vars
  if (env.GAO_APP_NAME) appConfig.name = env.GAO_APP_NAME;
  if (env.GAO_APP_PORT) appConfig.port = Number.parseInt(env.GAO_APP_PORT, 10);
  if (env.GAO_APP_DEBUG) appConfig.debug = env.GAO_APP_DEBUG === 'true';

  // Always override environment from detection
  appConfig.environment = environment;
}

/**
 * Validate config against the framework schema + optional custom schema.
 */
function validateConfig(raw: Record<string, unknown>, customSchema?: z.ZodType): GaoConfig {
  // Validate framework fields
  const parsed = gaoConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new InternalError(
      `Config validation failed:\n${issues}\n\nCheck your gao.config.ts file. GAO does NOT use .env files.`,
    );
  }

  // Validate custom schema if provided
  if (customSchema) {
    const customParsed = customSchema.safeParse(raw);
    if (!customParsed.success) {
      const issues = customParsed.error.issues
        .map((i: z.ZodIssue) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new InternalError(`Custom config validation failed:\n${issues}`);
    }
  }

  return parsed.data as GaoConfig;
}

/**
 * Deep merge two objects (source overrides target).
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key as keyof T];

    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      (result as Record<string, unknown>)[key] = sourceVal;
    }
  }

  return result;
}

/**
 * Deep freeze an object to make it fully immutable.
 */
function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T> {
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj as Record<string, unknown>)[name];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value as Record<string, unknown>);
    }
  }
  return Object.freeze(obj);
}
