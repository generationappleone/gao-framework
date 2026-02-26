/**
 * @gao/desktop — Desktop Build Pipeline
 *
 * Orchestrates `gao build desktop` via Tauri CLI.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export type DesktopTarget = 'windows' | 'linux' | 'macos';

export interface BuildOptions {
    targets?: DesktopTarget[];
    release?: boolean;
    verbose?: boolean;
    ci?: boolean;
}

/**
 * Map our target names to Tauri target triples.
 */
function targetTriple(t: DesktopTarget): string {
    switch (t) {
        case 'windows': return 'x86_64-pc-windows-msvc';
        case 'linux': return 'x86_64-unknown-linux-gnu';
        case 'macos': return 'x86_64-apple-darwin';
    }
}

/**
 * Build the desktop application using Tauri CLI.
 * Requires `@tauri-apps/cli` to be installed in the project.
 */
export async function buildDesktop(options: BuildOptions = {}): Promise<{ success: boolean; output: string }> {
    const args: string[] = ['npx', 'tauri', 'build'];

    if (options.verbose) args.push('--verbose');
    if (options.ci) args.push('--ci');

    if (options.targets?.length) {
        for (const t of options.targets) {
            args.push('--target', targetTriple(t));
        }
    }

    const cmd = args.join(' ');

    try {
        const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
        return { success: true, output: stdout + stderr };
    } catch (err: any) {
        return { success: false, output: err.message ?? String(err) };
    }
}
