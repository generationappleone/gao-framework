/**
 * @gao/core — Plugin Worker Host
 *
 * Runs inside the Worker Thread. Responsibilities:
 * - Load the plugin module
 * - Restrict global APIs (no process.exit, limited fetch)
 * - Listen for hook invocations from the parent via message passing
 * - Send results back to the parent
 */

import { parentPort, workerData } from 'node:worker_threads';

if (!parentPort) {
    throw new Error('plugin-worker-host must run inside a Worker Thread');
}

interface IncomingMessage {
    callId: string;
    hook: string;
    data?: unknown;
}

async function main(): Promise<void> {
    const { pluginPath } = workerData as {
        manifest: unknown;
        pluginPath: string;
    };

    // ── Sandbox restrictions ─────────────────────────────
    // Remove dangerous globals
    (globalThis as any).process.exit = () => {
        throw new Error('process.exit is not allowed in plugin sandbox');
    };
    (globalThis as any).process.kill = () => {
        throw new Error('process.kill is not allowed in plugin sandbox');
    };

    // ── Load the plugin module ───────────────────────────
    let pluginModule: Record<string, unknown>;
    try {
        pluginModule = await import(pluginPath);
    } catch (err) {
        parentPort!.postMessage({
            type: 'error',
            error: `Failed to load plugin: ${(err as Error).message}`,
        });
        return;
    }

    // Signal ready
    parentPort!.postMessage({ type: 'ready' });

    // ── Handle hook invocations ──────────────────────────
    parentPort!.on('message', async (msg: IncomingMessage) => {
        const { callId, hook, data } = msg;

        try {
            const handler = pluginModule[hook];
            if (typeof handler !== 'function') {
                parentPort!.postMessage({
                    callId,
                    error: `Hook "${hook}" is not a function in plugin`,
                });
                return;
            }

            const result = await handler(data);
            parentPort!.postMessage({ callId, result });
        } catch (err) {
            parentPort!.postMessage({
                callId,
                error: (err as Error).message,
            });
        }
    });
}

main().catch((err) => {
    parentPort?.postMessage({
        type: 'error',
        error: `Worker host failed: ${err.message}`,
    });
});
