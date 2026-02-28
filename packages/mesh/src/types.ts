/**
 * @gao/mesh — Types & Interfaces
 *
 * All type definitions for the encrypted overlay mesh network.
 */

// ─── Node Identity ──────────────────────────────────────────

export interface MeshNodeInfo {
    /** Unique identifier for this node (UUID v4) */
    nodeId: string;
    /** Ed25519 public key (base64url) for identity verification */
    publicKey: string;
    /** Network endpoints (e.g., ["tcp://10.0.0.1:9000"]) */
    endpoints: string[];
    /** Node role for routing decisions */
    role: 'app' | 'worker' | 'gateway' | 'database' | 'cache' | 'storage';
    /** Optional metadata (service name, version, etc.) */
    metadata?: Record<string, string>;
}

// ─── Message ─────────────────────────────────────────────────

export interface MeshMessage {
    /** Unique message ID */
    id: string;
    /** Source node ID */
    from: string;
    /** Destination node ID (or '*' for broadcast) */
    to: string;
    /** Topic/channel for routing */
    topic: string;
    /** Payload (serialized as JSON) */
    payload: unknown;
    /** Timestamp (ms since epoch) */
    timestamp: number;
}

export interface EncryptedMeshMessage {
    /** Source node ID (plaintext for routing) */
    from: string;
    /** Destination node ID */
    to: string;
    /** Encrypted MeshMessage (ChaCha20-Poly1305) */
    ciphertext: Buffer;
    /** 12-byte nonce */
    nonce: Buffer;
    /** 16-byte auth tag */
    tag: Buffer;
}

// ─── Peer ────────────────────────────────────────────────────

export interface PeerConnection {
    /** Remote node info */
    node: MeshNodeInfo;
    /** Current shared encryption key */
    sessionKey: Buffer;
    /** Connection state */
    state: 'connecting' | 'handshaking' | 'connected' | 'disconnected';
    /** Last heartbeat timestamp */
    lastHeartbeat: number;
    /** Number of messages exchanged */
    messageCount: number;
}

export type MessageHandler = (message: MeshMessage) => void | Promise<void>;

// ─── Discovery ──────────────────────────────────────────────

export interface DiscoveryProvider {
    /** Provider name */
    readonly name: string;
    /** Register this node with the discovery service */
    register(node: MeshNodeInfo): Promise<void>;
    /** Deregister this node */
    deregister(nodeId: string): Promise<void>;
    /** Get all known peers */
    discover(): Promise<MeshNodeInfo[]>;
}

// ─── Configuration ──────────────────────────────────────────

export interface MeshConfig {
    /** This node's listen address. Default: '0.0.0.0' */
    listenAddress?: string;
    /** This node's listen port. Default: 9876 */
    listenPort?: number;
    /** Node role. Default: 'app' */
    role?: MeshNodeInfo['role'];
    /** Discovery provider. Default: StaticDiscovery */
    discovery?: DiscoveryProvider;
    /** Encryption algorithm. Default: 'chacha20-poly1305' */
    encryption?: {
        algorithm: 'chacha20-poly1305' | 'aes-256-gcm';
        /** Key rotation interval in ms. Default: 3600000 (1 hour) */
        keyRotationIntervalMs?: number;
    };
    /** Heartbeat interval in ms. Default: 10000 (10s) */
    heartbeatIntervalMs?: number;
    /** Consider peer dead after N missed heartbeats. Default: 3 */
    maxMissedHeartbeats?: number;
    /** Optional metadata for this node */
    metadata?: Record<string, string>;
}
