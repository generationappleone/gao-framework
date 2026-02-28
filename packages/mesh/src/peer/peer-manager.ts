/**
 * @gao/mesh — Peer Manager
 *
 * Manages peer connections, heartbeats, and dead peer detection.
 */

import type {
    MeshNodeInfo,
    PeerConnection,
    MeshConfig,
} from '../types.js';

export class PeerManager {
    private readonly peers = new Map<string, PeerConnection>();
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private readonly heartbeatIntervalMs: number;
    private readonly maxMissedHeartbeats: number;
    private readonly onPeerDead: (nodeId: string) => void;

    constructor(
        config: MeshConfig = {},
        onPeerDead?: (nodeId: string) => void,
    ) {
        this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 10_000;
        this.maxMissedHeartbeats = config.maxMissedHeartbeats ?? 3;
        this.onPeerDead = onPeerDead ?? (() => { });
    }

    /**
     * Add a new peer connection.
     */
    addPeer(node: MeshNodeInfo, sessionKey: Buffer): PeerConnection {
        const peer: PeerConnection = {
            node,
            sessionKey,
            state: 'connected',
            lastHeartbeat: Date.now(),
            messageCount: 0,
        };
        this.peers.set(node.nodeId, peer);
        return peer;
    }

    /**
     * Get a peer by node ID.
     */
    getPeer(nodeId: string): PeerConnection | undefined {
        return this.peers.get(nodeId);
    }

    /**
     * Remove a peer.
     */
    removePeer(nodeId: string): void {
        this.peers.delete(nodeId);
    }

    /**
     * Record a heartbeat from a peer.
     */
    recordHeartbeat(nodeId: string): void {
        const peer = this.peers.get(nodeId);
        if (peer) {
            peer.lastHeartbeat = Date.now();
            peer.state = 'connected';
        }
    }

    /**
     * Increment message counter for a peer.
     */
    recordMessage(nodeId: string): void {
        const peer = this.peers.get(nodeId);
        if (peer) {
            peer.messageCount++;
        }
    }

    /**
     * Get all connected peers.
     */
    getConnectedPeers(): PeerConnection[] {
        return Array.from(this.peers.values()).filter(p => p.state === 'connected');
    }

    /**
     * Get all peer IDs.
     */
    getAllPeerIds(): string[] {
        return Array.from(this.peers.keys());
    }

    /**
     * Start dead peer detection loop.
     */
    startHeartbeatMonitor(): void {
        if (this.heartbeatTimer) return;

        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            const maxAge = this.heartbeatIntervalMs * this.maxMissedHeartbeats;

            for (const [nodeId, peer] of this.peers) {
                if (now - peer.lastHeartbeat > maxAge) {
                    peer.state = 'disconnected';
                    this.onPeerDead(nodeId);
                }
            }
        }, this.heartbeatIntervalMs);

        if (this.heartbeatTimer.unref) {
            this.heartbeatTimer.unref();
        }
    }

    /**
     * Stop the heartbeat monitor.
     */
    stopHeartbeatMonitor(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Get the number of connected peers.
     */
    get size(): number {
        return this.peers.size;
    }

    /**
     * Destroy all peer connections and stop monitoring.
     */
    destroy(): void {
        this.stopHeartbeatMonitor();
        // Wipe session keys
        for (const peer of this.peers.values()) {
            peer.sessionKey.fill(0);
        }
        this.peers.clear();
    }
}
