/**
 * @gao/desktop — Public API
 */

export { generateTauriConfig, serializeTauriConfig } from './tauri-config.js';
export type { DesktopConfig, TauriConf, TauriWindowConfig, TauriSecurityConfig } from './tauri-config.js';

export { createInvoker, createListener } from './ipc.js';
export type { IpcCommands, IpcEvents } from './ipc.js';

export { buildDesktop } from './build.js';
export type { BuildOptions, DesktopTarget } from './build.js';

export { checkForUpdate, installUpdate } from './updater.js';
export type { UpdateInfo, UpdaterConfig } from './updater.js';
