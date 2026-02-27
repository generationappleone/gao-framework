/**
 * @gao/cli — Application Loader Helper
 *
 * Loads gao.config.ts from CWD, connects to database,
 * and provides migration/seeder file scanning.
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import chalk from 'chalk';

export interface AppConfig {
    database?: {
        driver?: string;
        url?: string;
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
    };
    app?: {
        name?: string;
        port?: number;
        env?: string;
    };
    paths?: {
        migrations?: string;
        seeders?: string;
    };
}

export interface LoadedApp {
    config: AppConfig;
    migrationsDir: string;
    seedersDir: string;
}

/**
 * Load the application config from gao.config.ts in the current working directory.
 */
export async function loadApp(): Promise<LoadedApp> {
    const cwd = process.cwd();

    // Try to find gao.config.ts or gao.config.js
    const configPaths = [
        path.join(cwd, 'gao.config.ts'),
        path.join(cwd, 'gao.config.js'),
        path.join(cwd, 'gao.config.mjs'),
    ];

    let config: AppConfig = {};

    for (const configPath of configPaths) {
        try {
            await fs.access(configPath);
            const mod = await import(configPath);
            config = mod.default || mod;
            console.log(chalk.gray(`  Config loaded from ${path.basename(configPath)}`));
            break;
        } catch {
            // Config file not found, try next
        }
    }

    const migrationsDir = config.paths?.migrations
        ?? path.join(cwd, 'src', 'database', 'migrations');

    const seedersDir = config.paths?.seeders
        ?? path.join(cwd, 'src', 'database', 'seeders');

    return { config, migrationsDir, seedersDir };
}

/**
 * Scan a directory for TypeScript/JavaScript files and return them sorted.
 */
export async function scanFiles(dir: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(dir);
        return entries
            .filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.mjs'))
            .sort()
            .map(f => path.join(dir, f));
    } catch {
        return [];
    }
}

/**
 * Load migration files from a directory.
 * Each file should export a default or named Migration object.
 */
export async function loadMigrations(dir: string): Promise<Array<{
    name: string;
    up: string;
    down: string;
}>> {
    const files = await scanFiles(dir);
    const migrations: Array<{ name: string; up: string; down: string }> = [];

    for (const file of files) {
        try {
            const mod = await import(file);
            const migration = mod.default || mod;
            if (migration && typeof migration.up === 'string') {
                migrations.push({
                    name: path.basename(file, path.extname(file)),
                    up: migration.up,
                    down: migration.down || '',
                });
            }
        } catch (error) {
            console.error(chalk.yellow(`  ⚠️ Could not load migration: ${path.basename(file)}`));
        }
    }

    return migrations;
}

/**
 * Load seeder files from a directory.
 * Each file should export a Seeder object with name, run(), and optional dependencies.
 */
export async function loadSeeders(dir: string): Promise<Array<{
    name: string;
    dependencies?: string[];
    run: (driver: any) => Promise<void>;
}>> {
    const files = await scanFiles(dir);
    const seeders: Array<{
        name: string;
        dependencies?: string[];
        run: (driver: any) => Promise<void>;
    }> = [];

    for (const file of files) {
        try {
            const mod = await import(file);
            const seeder = mod.default || mod;
            if (seeder && typeof seeder.run === 'function') {
                seeders.push({
                    name: seeder.name || path.basename(file, path.extname(file)),
                    dependencies: seeder.dependencies,
                    run: seeder.run,
                });
            }
        } catch (error) {
            console.error(chalk.yellow(`  ⚠️ Could not load seeder: ${path.basename(file)}`));
        }
    }

    return seeders;
}
