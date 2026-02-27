import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

export const devCommand = new Command('dev')
    .description('Start the development server with hot reload')
    .option('-p, --port <number>', 'Port to run the server on')
    .action(async (options) => {
        console.log(chalk.bold.blue('🚀 Starting GAO dev server...'));

        const cwd = process.cwd();
        const entryPoint = await findEntryPoint(cwd);

        if (!entryPoint) {
            console.error(chalk.red('❌ Could not find entry point. Expected src/main.ts or src/index.ts'));
            process.exit(1);
        }

        console.log(chalk.gray(`  Entry: ${path.relative(cwd, entryPoint)}`));
        if (options.port) {
            console.log(chalk.gray(`  Port: ${options.port}`));
        }

        const isBun = !!(process as any).versions?.bun;

        if (isBun) {
            console.log(chalk.cyan('  Runtime: Bun (hot reload via --watch)'));
            startBunDev(entryPoint, options.port);
        } else {
            console.log(chalk.cyan('  Runtime: Node.js (--watch mode)'));
            startNodeDev(entryPoint, options.port);
        }
    });

async function findEntryPoint(cwd: string): Promise<string | null> {
    const candidates = [
        path.join(cwd, 'src', 'main.ts'),
        path.join(cwd, 'src', 'index.ts'),
        path.join(cwd, 'src', 'main.js'),
        path.join(cwd, 'src', 'index.js'),
    ];

    for (const candidate of candidates) {
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            // Not found, try next
        }
    }

    return null;
}

function startBunDev(entryPoint: string, port?: string) {
    const env: Record<string, string> = { ...process.env as Record<string, string>, NODE_ENV: 'development' };
    if (port) env.PORT = port;

    const child = spawn('bun', ['--watch', entryPoint], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env,
    });

    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping dev server...'));
        child.kill('SIGINT');
        process.exit(0);
    });

    child.on('exit', (code) => {
        process.exit(code ?? 0);
    });
}

function startNodeDev(entryPoint: string, port?: string) {
    const env: Record<string, string> = { ...process.env as Record<string, string>, NODE_ENV: 'development' };
    if (port) env.PORT = port;

    // If TypeScript, use tsx or ts-node
    if (entryPoint.endsWith('.ts')) {
        const child = spawn('npx', ['tsx', 'watch', entryPoint], {
            cwd: process.cwd(),
            stdio: 'inherit',
            env,
            shell: true,
        });

        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n🛑 Stopping dev server...'));
            child.kill('SIGINT');
            process.exit(0);
        });

        child.on('exit', (code) => {
            process.exit(code ?? 0);
        });
    } else {
        const args = ['--watch', '--experimental-specifier-resolution=node'];
        const child = spawn('node', [...args, entryPoint], {
            cwd: process.cwd(),
            stdio: 'inherit',
            env,
        });

        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n🛑 Stopping dev server...'));
            child.kill('SIGINT');
            process.exit(0);
        });

        child.on('exit', (code) => {
            process.exit(code ?? 0);
        });
    }
}
