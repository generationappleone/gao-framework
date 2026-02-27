import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

export const buildCommand = new Command('build')
    .description('Build the GAO application for production')
    .option('--clean', 'Remove dist/ before building')
    .action(async (options) => {
        console.log(chalk.bold.blue('🚀 Building the project for production...'));

        const cwd = process.cwd();

        // Clean dist/ if requested
        if (options.clean) {
            const distDir = path.join(cwd, 'dist');
            try {
                await fs.rm(distDir, { recursive: true, force: true });
                console.log(chalk.gray('  🗑️  Cleaned dist/ directory'));
            } catch {
                // Already clean
            }
        }

        // Check for tsconfig.json
        const tsconfigPath = path.join(cwd, 'tsconfig.json');
        try {
            await fs.access(tsconfigPath);
        } catch {
            console.error(chalk.red('❌ tsconfig.json not found in the current directory.'));
            process.exit(1);
        }

        try {
            const start = Date.now();

            console.log(chalk.gray('  Compiling TypeScript...'));
            execSync('npx tsc --project tsconfig.json', {
                cwd,
                stdio: 'pipe',
            });

            const elapsed = Date.now() - start;

            // Count output files
            const distDir = path.join(cwd, 'dist');
            let fileCount = 0;
            try {
                const entries = await fs.readdir(distDir, { recursive: true });
                fileCount = entries.filter(e => typeof e === 'string' && e.endsWith('.js')).length;
            } catch {
                // dist may not be the output dir
            }

            console.log(chalk.green(`\n✅ Build finished successfully in ${elapsed}ms.`));
            if (fileCount > 0) {
                console.log(chalk.gray(`  📁 ${fileCount} JavaScript file(s) generated in dist/`));
            }

        } catch (error: any) {
            console.error(chalk.red('❌ Build failed:'));
            if (error.stdout) {
                console.error(error.stdout.toString());
            }
            if (error.stderr) {
                console.error(error.stderr.toString());
            }
            process.exit(1);
        }
    });
