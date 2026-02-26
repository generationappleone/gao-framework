/**
 * @gao/mobile — Mobile Build Pipeline
 *
 * Orchestrates `gao build android` & `gao build ios` via Capacitor CLI.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export type MobileTarget = 'android' | 'ios';

export interface MobileBuildOptions {
    target: MobileTarget;
    release?: boolean;
    verbose?: boolean;
}

/**
 * Sync web assets and build the native project via Capacitor CLI.
 */
export async function buildMobile(options: MobileBuildOptions): Promise<{ success: boolean; output: string }> {
    const steps = [
        // 1. Sync web assets to native project
        `npx cap sync ${options.target}`,
        // 2. Open native IDE (or build directly in CI)
        options.release
            ? `npx cap build ${options.target}`
            : `npx cap open ${options.target}`,
    ];

    const outputs: string[] = [];

    for (const cmd of steps) {
        try {
            const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
            outputs.push(stdout + stderr);
        } catch (err: any) {
            return { success: false, output: outputs.join('\n') + '\n' + (err.message ?? String(err)) };
        }
    }

    return { success: true, output: outputs.join('\n') };
}
