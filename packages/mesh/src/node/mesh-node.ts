/**
 * @gao/mesh — Mesh Node
 *
 * The main mesh network node that ties together peer management,
 * encrypted transport, discovery, and message routing.
 */

import { randomUUID } from 'node:crypto';
import type {
    MeshConfig,
    MeshNodeInfo,
    MeshMessage,
    MessageHandler,
} from '../types.js';
import { PeerManager } from '../peer/peer-manager.js';
import { StaticDiscovery } from '../discovery/static-discovery.js';
import { encryptMessage, decryptMessage, serializeWireMessage } from '../transport/chacha-transport.js';

export class MeshNode {
    readonly nodeId: string;
    readonly info: MeshNodeInfo;
    private readonly peerManager: PeerManager;
    private readonly config: Required<Pick<MeshConfig, 'listenAddress' | 'listenPort' | 'role' | 'heartbeatIntervalMs' | 'maxMissedHeartbeats'>>;
    private readonly discovery: NonNullable<MeshConfig['discovery']>;
    private readonly topicHandlers = new Map<string, MessageHandler[]>();
    private readonly wildcardHandlers: MessageHandler[] = [];
    private _running = false;

    constructor(config: MeshConfig = {}) {
        this.nodeId = randomUUID();
        this.config = {
            listenAddress: config.listenAddress ?? '0.0.0.0',
            listenPort: config.listenPort ?? 9876,
            role: config.role ?? 'app',
            heartbeatIntervalMs: config.heartbeatIntervalMs ?? 10_000,
            maxMissedHeartbeats: config.maxMissedHeartbeats ?? 3,
        };

        this.discovery = config.discovery ?? new StaticDiscovery();

        this.info = {
            nodeId: this.nodeId,
            publicKey: '', // Will be set during init
            endpoints: [`tcp://${this.config.listenAddress}:${this.config.listenPort}`],
            role: this.config.role,
            metadata: config.metadata,
        };

        this.peerManager = new PeerManager(config, (deadNodeId) => {
            console.warn(`[GAO:mesh] Peer ${deadNodeId} is dead`);
            this.peerManager.removePeer(deadNodeId);
        });
    }

    /**
     * Start the mesh node — register with discovery and begin listening.
     */
    async start(): Promise<void> {
        await this.discovery.register(this.info);
        this.peerManager.startHeartbeatMonitor();
        this._running = true;
    }

    /**
     * Stop the mesh node — deregister and disconnect all peers.
     */
    async stop(): Promise<void> {
        this._running = false;
        this.peerManager.destroy();
        await this.discovery.deregister(this.nodeId);
    }

    /**
     * Connect to a known peer.
     * In a real implementation, this would open a TCP/QUIC connection.
     * For now, it registers the peer with a shared session key.
     */
    async connectToPeer(node: MeshNodeInfo, sessionKey: Buffer): Promise<void> {
        this.peerManager.addPeer(node, sessionKey);
    }

    /**
     * Subscribe to a topic.
     */
    on(topic: string, handler: MessageHandler): void {
        if (topic === '*') {
            this.wildcardHandlers.push(handler);
            return;
        }
        const handlers = this.topicHandlers.get(topic) ?? [];
        handlers.push(handler);
        this.topicHandlers.set(topic, handlers);
    }

    /**
     * Unsubscribe from a topic.
     */
    off(topic: string, handler: MessageHandler): void {
        if (topic === '*') {
            const idx = this.wildcardHandlers.indexOf(handler);
            if (idx >= 0) this.wildcardHandlers.splice(idx, 1);
            return;
        }
        const handlers = this.topicHandlers.get(topic);
        if (handlers) {
            const idx = handlers.indexOf(handler);
            if (idx >= 0) handlers.splice(idx, 1);
        }
    }

    /**
     * Send a message to a specific peer.
     *
     * @returns The serialized encrypted wire message ready for transport.
     *          The caller (or a registered transport) is responsible for
     *          actually delivering this data to the remote node.
     */
    async send(toPeerId: string, topic: string, payload: unknown): Promise<Buffer> {
        const peer = this.peerManager.getPeer(toPeerId);
        if (!peer) throw new Error(`Peer ${toPeerId} not connected`);

        const message: MeshMessage = {
            id: randomUUID(),
            from: this.nodeId,
            to: toPeerId,
            topic,
            payload,
            timestamp: Date.now(),
        };

        // Encrypt and serialize to wire format
        const encrypted = encryptMessage(message, peer.sessionKey);
        const wireData = serializeWireMessage(encrypted);
        this.peerManager.recordMessage(toPeerId);

        return wireData;
    }

    /**
     * Broadcast a message to all connected peers.
     */
    async broadcast(topic: string, payload: unknown): Promise<void> {
        const peers = this.peerManager.getConnectedPeers();
        const promises = peers.map(peer =>
            this.send(peer.node.nodeId, topic, payload).catch(() => {
                // Silent fail for broadcast — some peers may be unreachable
            }),
        );
        await Promise.allSettled(promises);
    }

    /**
     * Handle an incoming encrypted message.
     * Called when the transport layer receives data.
     */
    async handleIncomingMessage(fromNodeId: string, ciphertext: Buffer, nonce: Buffer, tag: Buffer): Promise<void> {
        const peer = this.peerManager.getPeer(fromNodeId);
        if (!peer) {
            console.warn(`[GAO:mesh] Received message from unknown peer: ${fromNodeId}`);
            return;
        }

        const decrypted = decryptMessage(
            { from: fromNodeId, to: this.nodeId, ciphertext, nonce, tag },
            peer.sessionKey,
        );

        this.peerManager.recordHeartbeat(fromNodeId);
        this.peerManager.recordMessage(fromNodeId);

        // Dispatch to topic handlers
        await this.dispatchMessage(decrypted);
    }

    /**
     * Dispatch a decrypted message to registered handlers.
     */
    private async dispatchMessage(message: MeshMessage): Promise<void> {
        // Topic-specific handlers
        const handlers = this.topicHandlers.get(message.topic) ?? [];
        for (const handler of handlers) {
            await handler(message);
        }

        // Wildcard handlers
        for (const handler of this.wildcardHandlers) {
            await handler(message);
        }
    }

    /**
     * Discover and connect to peer nodes.
     */
    async discoverPeers(): Promise<MeshNodeInfo[]> {
        const nodes = await this.discovery.discover();
        return nodes.filter(n => n.nodeId !== this.nodeId);
    }

    get running(): boolean { return this._running; }
    get connectedPeers(): number { return this.peerManager.size; }
}
