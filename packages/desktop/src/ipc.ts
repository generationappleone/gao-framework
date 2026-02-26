/**
 * @gao/desktop — Type-safe IPC Bridge
 *
 * Provides a typed wrapper around Tauri's invoke/listen API
 * for communication between web frontend and Rust backend.
 */

/**
 * IPC command definition — maps command names to their argument & return types.
 */
export type IpcCommands = Record<string, { args?: Record<string, unknown>; returns?: unknown }>;

/**
 * IPC event definition — maps event names to their payload type.
 */
export type IpcEvents = Record<string, unknown>;

/**
 * Create a type-safe invoke function.
 *
 * In a real Tauri app the actual implementation delegates to `@tauri-apps/api/core`.
 * This abstraction lets us mock it in tests and keeps user code type-safe.
 */
export function createInvoker<C extends IpcCommands>() {
    return {
        /**
         * Invoke a Tauri command with type-safe arguments & return type.
         */
        async invoke<K extends keyof C & string>(
            cmd: K,
            args?: C[K] extends { args: infer A } ? A : never,
        ): Promise<C[K] extends { returns: infer R } ? R : void> {
            // At build-time this is replaced by Tauri's real invoke.
            // In Node.js / test environments we throw so tests can mock it.
            if (typeof globalThis !== 'undefined' && '__TAURI__' in globalThis) {
                // Running inside Tauri webview
                const { invoke: tauriInvoke } = await import('@tauri-apps/api/core' as string);
                return tauriInvoke(cmd, args ?? {}) as any;
            }
            throw new Error(`IPC invoke "${cmd}" called outside Tauri runtime. Did you forget to mock?`);
        },
    };
}

/**
 * Create a type-safe event listener.
 */
export function createListener<E extends IpcEvents>() {
    return {
        /**
         * Listen for a Tauri event with a typed payload.
         */
        async listen<K extends keyof E & string>(
            event: K,
            handler: (payload: E[K]) => void,
        ): Promise<() => void> {
            if (typeof globalThis !== 'undefined' && '__TAURI__' in globalThis) {
                const { listen: tauriListen } = await import('@tauri-apps/api/event' as string);
                const unlisten = await tauriListen(event, (e: any) => handler(e.payload));
                return unlisten;
            }
            // Fallback: return a no-op unlisten. Useful for SSR.
            return () => { };
        },
    };
}
