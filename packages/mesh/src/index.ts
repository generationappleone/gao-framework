/**
 * @gao/mesh — Public API
 *
 * Encrypted overlay mesh network for GAO Framework.
 * Provides secure inter-service communication with ChaCha20-Poly1305.
 */

// ─── Types ───────────────────────────────────────────────────
export type {
    MeshNodeInfo,
    MeshMessage,
    EncryptedMeshMessage,
    PeerConnection,
    MessageHandler,
    DiscoveryProvider,
    MeshConfig,
} from './types.js';

// ─── Transport Encryption ────────────────────────────────────
export {
    encryptMessage,
    decryptMessage,
    serializeWireMessage,
    deserializeWireMessage,
} from './transport/chacha-transport.js';

// ─── Peer Management ────────────────────────────────────────
export { PeerManager } from './peer/peer-manager.js';

// ─── Discovery ──────────────────────────────────────────────
export { StaticDiscovery } from './discovery/static-discovery.js';

// ─── Mesh Node ──────────────────────────────────────────────
export { MeshNode } from './node/mesh-node.js';
