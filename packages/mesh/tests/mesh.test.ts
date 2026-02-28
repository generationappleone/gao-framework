import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import {
    encryptMessage,
    decryptMessage,
    serializeWireMessage,
    deserializeWireMessage,
} from '../src/transport/chacha-transport.js';
import { PeerManager } from '../src/peer/peer-manager.js';
import { StaticDiscovery } from '../src/discovery/static-discovery.js';
import { MeshNode } from '../src/node/mesh-node.js';
import type { MeshMessage, MeshNodeInfo } from '../src/types.js';

// ─── ChaCha20-Poly1305 Transport ────────────────────────────

describe('ChaCha20-Poly1305 Transport', () => {
    const sessionKey = randomBytes(32);

    function mockMessage(overrides?: Partial<MeshMessage>): MeshMessage {
        return {
            id: randomUUID(),
            from: 'node-a',
            to: 'node-b',
            topic: 'test',
            payload: { data: 'hello world' },
            timestamp: Date.now(),
            ...overrides,
        };
    }

    it('should encrypt and decrypt a message', () => {
        const msg = mockMessage();
        const encrypted = encryptMessage(msg, sessionKey);
        const decrypted = decryptMessage(encrypted, sessionKey);

        expect(decrypted.id).toBe(msg.id);
        expect(decrypted.topic).toBe('test');
        expect(decrypted.payload).toEqual({ data: 'hello world' });
    });

    it('should fail with wrong key', () => {
        const msg = mockMessage();
        const encrypted = encryptMessage(msg, sessionKey);
        const wrongKey = randomBytes(32);

        expect(() => decryptMessage(encrypted, wrongKey)).toThrow('decryption failed');
    });

    it('should fail if ciphertext is tampered', () => {
        const msg = mockMessage();
        const encrypted = encryptMessage(msg, sessionKey);

        encrypted.ciphertext[0] = (encrypted.ciphertext[0]! + 1) % 256;
        expect(() => decryptMessage(encrypted, sessionKey)).toThrow('decryption failed');
    });

    it('should produce unique ciphertext each time (random nonce)', () => {
        const msg = mockMessage();
        const e1 = encryptMessage(msg, sessionKey);
        const e2 = encryptMessage(msg, sessionKey);

        expect(e1.nonce.equals(e2.nonce)).toBe(false);
        expect(e1.ciphertext.equals(e2.ciphertext)).toBe(false);
    });

    it('should reject invalid key length', () => {
        const msg = mockMessage();
        expect(() => encryptMessage(msg, Buffer.alloc(16))).toThrow('32 bytes');
    });

    it('should handle large payloads', () => {
        const msg = mockMessage({ payload: { big: 'x'.repeat(50_000) } });
        const encrypted = encryptMessage(msg, sessionKey);
        const decrypted = decryptMessage(encrypted, sessionKey);
        expect((decrypted.payload as Record<string, string>)['big']!.length).toBe(50_000);
    });

    it('should handle unicode payloads', () => {
        const msg = mockMessage({ payload: { emoji: '🔐🌐', jp: '暗号化' } });
        const encrypted = encryptMessage(msg, sessionKey);
        const decrypted = decryptMessage(encrypted, sessionKey);
        expect(decrypted.payload).toEqual({ emoji: '🔐🌐', jp: '暗号化' });
    });
});

// ─── Wire Format ────────────────────────────────────────────

describe('Wire Format Serialization', () => {
    it('should round-trip serialize and deserialize', () => {
        const sessionKey = randomBytes(32);
        const msg: MeshMessage = {
            id: 'msg-1',
            from: 'node-alpha',
            to: 'node-beta',
            topic: 'sync',
            payload: { version: 2 },
            timestamp: Date.now(),
        };

        const encrypted = encryptMessage(msg, sessionKey);
        const wire = serializeWireMessage(encrypted);
        const deserialized = deserializeWireMessage(wire);

        expect(deserialized.from).toBe('node-alpha');
        expect(deserialized.to).toBe('node-beta');
        expect(deserialized.nonce.equals(encrypted.nonce)).toBe(true);
        expect(deserialized.tag.equals(encrypted.tag)).toBe(true);
        expect(deserialized.ciphertext.equals(encrypted.ciphertext)).toBe(true);

        // And we can still decrypt
        const decrypted = decryptMessage(deserialized, sessionKey);
        expect(decrypted.id).toBe('msg-1');
        expect(decrypted.payload).toEqual({ version: 2 });
    });
});

// ─── Peer Manager ───────────────────────────────────────────

describe('PeerManager', () => {
    let pm: PeerManager;

    beforeEach(() => {
        pm = new PeerManager();
    });

    afterEach(() => {
        pm.destroy();
    });

    function mockNode(overrides?: Partial<MeshNodeInfo>): MeshNodeInfo {
        return {
            nodeId: randomUUID(),
            publicKey: randomBytes(32).toString('base64url'),
            endpoints: ['tcp://127.0.0.1:9000'],
            role: 'app',
            ...overrides,
        };
    }

    it('should add and get a peer', () => {
        const node = mockNode();
        const key = randomBytes(32);
        pm.addPeer(node, key);

        const peer = pm.getPeer(node.nodeId);
        expect(peer).toBeDefined();
        expect(peer!.state).toBe('connected');
        expect(peer!.messageCount).toBe(0);
    });

    it('should remove a peer', () => {
        const node = mockNode();
        pm.addPeer(node, randomBytes(32));
        pm.removePeer(node.nodeId);
        expect(pm.getPeer(node.nodeId)).toBeUndefined();
    });

    it('should record heartbeats', () => {
        const node = mockNode();
        pm.addPeer(node, randomBytes(32));

        const before = pm.getPeer(node.nodeId)!.lastHeartbeat;
        // Small delay to ensure timestamp changes
        pm.recordHeartbeat(node.nodeId);
        const after = pm.getPeer(node.nodeId)!.lastHeartbeat;

        expect(after).toBeGreaterThanOrEqual(before);
    });

    it('should track message count', () => {
        const node = mockNode();
        pm.addPeer(node, randomBytes(32));

        pm.recordMessage(node.nodeId);
        pm.recordMessage(node.nodeId);
        pm.recordMessage(node.nodeId);

        expect(pm.getPeer(node.nodeId)!.messageCount).toBe(3);
    });

    it('should get connected peers', () => {
        const n1 = mockNode();
        const n2 = mockNode();
        pm.addPeer(n1, randomBytes(32));
        pm.addPeer(n2, randomBytes(32));

        expect(pm.getConnectedPeers().length).toBe(2);
    });

    it('should wipe session keys on destroy', () => {
        const key = randomBytes(32);
        const keyCopy = Buffer.from(key);
        const node = mockNode();
        pm.addPeer(node, key);

        pm.destroy();
        // Session key should be zeroed
        expect(key.every(b => b === 0)).toBe(true);
        expect(keyCopy.every(b => b === 0)).toBe(false);
    });
});

// ─── Static Discovery ───────────────────────────────────────

describe('StaticDiscovery', () => {
    it('should register and discover nodes', async () => {
        const discovery = new StaticDiscovery();
        const node: MeshNodeInfo = {
            nodeId: 'node-1',
            publicKey: 'pk1',
            endpoints: ['tcp://10.0.0.1:9000'],
            role: 'app',
        };

        await discovery.register(node);
        const peers = await discovery.discover();
        expect(peers.length).toBe(1);
        expect(peers[0]!.nodeId).toBe('node-1');
    });

    it('should deregister nodes', async () => {
        const discovery = new StaticDiscovery();
        await discovery.register({ nodeId: 'n1', publicKey: 'pk', endpoints: [], role: 'app' });
        await discovery.deregister('n1');
        expect((await discovery.discover()).length).toBe(0);
    });

    it('should accept initial peers in constructor', () => {
        const discovery = new StaticDiscovery([
            { nodeId: 'a', publicKey: 'pk', endpoints: [], role: 'app' },
            { nodeId: 'b', publicKey: 'pk', endpoints: [], role: 'worker' },
        ]);
        expect(discovery.size).toBe(2);
    });
});

// ─── Mesh Node ──────────────────────────────────────────────

describe('MeshNode', () => {
    it('should create a node with a unique ID', () => {
        const node = new MeshNode();
        expect(node.nodeId).toBeTruthy();
        expect(node.nodeId.length).toBe(36); // UUID format
    });

    it('should start and stop', async () => {
        const node = new MeshNode({ listenPort: 19876 });
        await node.start();
        expect(node.running).toBe(true);

        await node.stop();
        expect(node.running).toBe(false);
    });

    it('should connect to peers', async () => {
        const node = new MeshNode();
        await node.start();

        const peerInfo: MeshNodeInfo = {
            nodeId: 'peer-1',
            publicKey: 'pk',
            endpoints: ['tcp://127.0.0.1:9001'],
            role: 'worker',
        };

        await node.connectToPeer(peerInfo, randomBytes(32));
        expect(node.connectedPeers).toBe(1);

        await node.stop();
    });

    it('should subscribe to topics and dispatch messages', async () => {
        const nodeA = new MeshNode();
        const nodeB = new MeshNode();
        await nodeA.start();
        await nodeB.start();

        const sessionKey = randomBytes(32);
        await nodeA.connectToPeer(nodeB.info, sessionKey);

        // Subscribe to 'orders' topic
        let receivedPayload: unknown;
        nodeA.on('orders', (msg) => {
            receivedPayload = msg.payload;
        });

        // Simulate incoming encrypted message from nodeB
        const msg: MeshMessage = {
            id: randomUUID(),
            from: nodeB.nodeId,
            to: nodeA.nodeId,
            topic: 'orders',
            payload: { orderId: 'ORD-123', status: 'shipped' },
            timestamp: Date.now(),
        };

        const encrypted = encryptMessage(msg, sessionKey);
        await nodeA.handleIncomingMessage(
            nodeB.nodeId,
            encrypted.ciphertext,
            encrypted.nonce,
            encrypted.tag,
        );

        expect(receivedPayload).toEqual({ orderId: 'ORD-123', status: 'shipped' });

        await nodeA.stop();
        await nodeB.stop();
    });

    it('should support wildcard handlers', async () => {
        const node = new MeshNode();
        await node.start();

        const sessionKey = randomBytes(32);
        const peerInfo: MeshNodeInfo = {
            nodeId: 'peer-2',
            publicKey: 'pk',
            endpoints: [],
            role: 'app',
        };
        await node.connectToPeer(peerInfo, sessionKey);

        const received: string[] = [];
        node.on('*', (msg) => { received.push(msg.topic); });

        // Send messages on different topics
        for (const topic of ['users', 'orders', 'notifications']) {
            const msg: MeshMessage = {
                id: randomUUID(),
                from: 'peer-2',
                to: node.nodeId,
                topic,
                payload: {},
                timestamp: Date.now(),
            };
            const enc = encryptMessage(msg, sessionKey);
            await node.handleIncomingMessage('peer-2', enc.ciphertext, enc.nonce, enc.tag);
        }

        expect(received).toEqual(['users', 'orders', 'notifications']);
        await node.stop();
    });

    it('should discover peers via discovery provider', async () => {
        const discovery = new StaticDiscovery([
            { nodeId: 'peer-a', publicKey: 'pk', endpoints: ['tcp://10.0.0.1:9000'], role: 'app' },
            { nodeId: 'peer-b', publicKey: 'pk', endpoints: ['tcp://10.0.0.2:9000'], role: 'worker' },
        ]);

        const node = new MeshNode({ discovery });
        await node.start();

        const peers = await node.discoverPeers();
        // Should exclude self
        expect(peers.length).toBe(2);

        await node.stop();
    });
});
