/**
 * @gao/core — Worker Sandbox
 *
 * Runs plugin code in an isolated Node.js Worker Thread with:
 * - Configurable V8 resource limits (maxOldGenerationSizeMb)
 * - Message-passing based RPC (invoke hook → response/error)
 * - Automatic timeout enforcement per invocation
 * - Graceful termination and crash recovery
 */

import { Worker } from 'node:worker_threads';
import type { PluginManifest } from './plugin-manifest.js';

export interface WorkerSandboxOptions {
    /** Maximum old-generation heap in MB. Default: 128. */
    maxHeapMB?: number;
    /** Default invocation timeout in milliseconds. Default: 5000. */
    defaultTimeoutMs?: number;
}

interface PendingCall {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
}

export class WorkerSandbox {
    private worker: Worker | undefined;
    private pendingCalls = new Map<string, PendingCall>();
    private callId = 0;
    private _isRunning = false;
    private _manifest: PluginManifest | undefined;

    constructor(private readonly options: WorkerSandboxOptions = {}) { }

    /** Load a plugin in a Worker Thread with resource limits. */
    async load(manifest: PluginManifest, hostPath: string): Promise<void> {
        this._manifest = manifest;

        const maxHeapMB = manifest.budget?.maxHeapMB ?? this.options.maxHeapMB ?? 128;

        this.worker = new Worker(hostPath, {
            workerData: {
                manifest,
                pluginPath: manifest.main,
            },
            resourceLimits: {
                maxOldGenerationSizeMb: maxHeapMB,
                maxYoungGenerationSizeMb: Math.max(8, Math.floor(maxHeapMB / 4)),
            },
        });

        this._isRunning = true;

        this.worker.on('message', (msg: { callId: string; result?: unknown; error?: string }) => {
            const pending = this.pendingCalls.get(msg.callId);
            if (!pending) return;

            clearTimeout(pending.timer);
            this.pendingCalls.delete(msg.callId);

            if (msg.error) {
                pending.reject(new Error(`Plugin error: ${msg.error}`));
            } else {
                pending.resolve(msg.result);
            }
        });

        this.worker.on('error', (err: Error) => {
            this.rejectAllPending(err);
        });

        this.worker.on('exit', (code) => {
            this._isRunning = false;
            if (code !== 0) {
                this.rejectAllPending(new Error(`Worker exited with code ${code}`));
            }
        });

        // Wait for worker to report ready
        await new Promise<void>((resolve, reject) => {
            const readyTimeout = setTimeout(() => {
                reject(new Error('Worker did not become ready within timeout'));
            }, 10000);

            const onMessage = (msg: { type: string }) => {
                if (msg.type === 'ready') {
                    clearTimeout(readyTimeout);
                    this.worker?.off('message', onMessage);
                    resolve();
                }
            };

            this.worker!.on('message', onMessage);
        });
    }

    /**
     * Invoke a hook on the sandboxed plugin.
     * Returns the result or throws on error/timeout.
     */
    async invoke(hook: string, data?: unknown, timeoutMs?: number): Promise<unknown> {
        if (!this.worker || !this._isRunning) {
            throw new Error('Worker is not running');
        }

        const id = String(++this.callId);
        const timeout = timeoutMs ?? this.options.defaultTimeoutMs ?? 5000;

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingCalls.delete(id);
                reject(new Error(`Plugin hook "${hook}" timed out after ${timeout}ms`));
            }, timeout);

            this.pendingCalls.set(id, { resolve, reject, timer });
            this.worker!.postMessage({ callId: id, hook, data });
        });
    }

    /** Gracefully terminate the worker. */
    async terminate(): Promise<void> {
        if (!this.worker) return;
        this.rejectAllPending(new Error('Worker terminated'));
        await this.worker.terminate();
        this.worker = undefined;
        this._isRunning = false;
    }

    /** Whether the worker is currently running. */
    get isRunning(): boolean {
        return this._isRunning;
    }

    /** The loaded plugin manifest. */
    get manifest(): PluginManifest | undefined {
        return this._manifest;
    }

    private rejectAllPending(error: Error): void {
        for (const [id, pending] of this.pendingCalls) {
            clearTimeout(pending.timer);
            pending.reject(error);
            this.pendingCalls.delete(id);
        }
    }
}
