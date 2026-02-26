import { describe, it, expect } from 'vitest';
import { createInvoker, createListener } from '../src/ipc.js';

describe('IPC Bridge', () => {
    it('should throw when invoke is called outside Tauri runtime', async () => {
        type Commands = {
            greet: { args: { name: string }; returns: string };
        };
        const ipc = createInvoker<Commands>();
        await expect(ipc.invoke('greet', { name: 'GAO' })).rejects.toThrow('outside Tauri runtime');
    });

    it('should return a no-op unlisten when listen is called outside Tauri', async () => {
        type Events = { 'file-drop': { path: string } };
        const bus = createListener<Events>();
        const unlisten = await bus.listen('file-drop', () => { });
        expect(typeof unlisten).toBe('function');
        // Calling unlisten should not throw.
        unlisten();
    });
});
