# @gao/mesh

Encrypted overlay mesh network for secure inter-service communication in the GAO Framework. All traffic between nodes is encrypted using **ChaCha20-Poly1305** AEAD — zero external dependencies, uses Node.js built-in `crypto` module.

## Features

-   **ChaCha20-Poly1305 Transport Encryption** — AEAD encryption for all inter-node messages with AAD sender authentication.
-   **Binary Wire Format** — Compact serialization for efficient network transmission.
-   **Peer Management** — Heartbeat monitoring, dead peer detection, session key lifecycle, and automatic cleanup.
-   **Topic-Based Message Routing** — Subscribe to topics with specific or wildcard (`*`) handlers.
-   **Pluggable Discovery** — Static peer lists (built-in) with extensible `DiscoveryProvider` interface (DNS, Consul, etcd, etc.).
-   **Key Wiping** — Session keys are zeroed from memory on peer disconnect or node shutdown.
-   **Wire-Ready Send** — `send()` returns serialized encrypted wire data ready for TCP/QUIC transport.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    MeshNode                          │
│                                                      │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │Discovery │  │ PeerManager │  │ Topic Handlers   │ │
│  │ Provider │  │             │  │ ┌──────────────┐ │ │
│  │          │  │ • heartbeat │  │ │ orders       │ │ │
│  │ • static │  │ • dead peer │  │ │ users        │ │ │
│  │ • dns    │  │ • key wipe  │  │ │ * (wildcard) │ │ │
│  └─────────┘  └─────────────┘  │ └──────────────┘ │ │
│                                  └──────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ChaCha20-Poly1305 Transport                     │ │
│  │  encrypt → serialize → [wire] → deserialize → decrypt │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Quick Start

### Create and Connect Nodes

```typescript
import { MeshNode, StaticDiscovery } from '@gao/mesh';
import { randomBytes } from 'node:crypto';

// Node A — the order service
const nodeA = new MeshNode({
    role: 'app',
    listenPort: 9001,
    metadata: { service: 'order-service' },
});

// Node B — the notification service
const nodeB = new MeshNode({
    role: 'worker',
    listenPort: 9002,
    metadata: { service: 'notification-service' },
});

await nodeA.start();
await nodeB.start();

// Establish encrypted connection (shared session key)
const sessionKey = randomBytes(32);
await nodeA.connectToPeer(nodeB.info, sessionKey);
await nodeB.connectToPeer(nodeA.info, sessionKey);
```

### Subscribe to Topics

```typescript
// Node B listens for order events
nodeB.on('orders', async (msg) => {
    console.log('New order:', msg.payload);
    await sendNotification(msg.payload);
});

// Wildcard handler — receives ALL messages
nodeB.on('*', async (msg) => {
    console.log(`[${msg.topic}] from ${msg.from}`);
});
```

### Send Encrypted Messages

```typescript
// Send to specific peer — returns encrypted wire-ready buffer
const wireData = await nodeA.send(nodeB.nodeId, 'orders', {
    orderId: 'ORD-12345',
    status: 'shipped',
    customer: 'alice@example.com',
});
// wireData is a Buffer ready for TCP/QUIC transport

// Broadcast to all connected peers
await nodeA.broadcast('system', { event: 'config-reload' });
```

### Handle Incoming Encrypted Messages

```typescript
// When the transport layer receives data from a peer:
const { ciphertext, nonce, tag } = parseIncomingTcpData(rawData);

await nodeB.handleIncomingMessage(
    senderNodeId,
    ciphertext,
    nonce,
    tag,
);
// → Automatically decrypted and dispatched to topic handlers
```

### Discovery

```typescript
import { StaticDiscovery } from '@gao/mesh';

// Static discovery — define peers at startup
const discovery = new StaticDiscovery([
    { nodeId: 'node-a', publicKey: 'pk_a', endpoints: ['tcp://10.0.0.1:9001'], role: 'app' },
    { nodeId: 'node-b', publicKey: 'pk_b', endpoints: ['tcp://10.0.0.2:9002'], role: 'worker' },
]);

const node = new MeshNode({ discovery });
await node.start();

// Discover peers (excludes self)
const peers = await node.discoverPeers();
```

## Security Properties

| Property | Implementation |
|----------|---------------|
| Encryption | ChaCha20-Poly1305 — AEAD (256-bit key, 96-bit nonce) |
| Authentication | Sender ID bound as AAD — prevents message spoofing |
| Key Length | 32 bytes (256-bit) — enforced at encrypt/decrypt boundaries |
| Tamper Detection | Poly1305 MAC (128-bit authentication tag) |
| Key Wiping | `Buffer.fill(0)` on peer disconnect / node destroy |
| Nonce | Random 12-byte nonce per message (no reuse) |

## Wire Format

```
[4B from_len][from][4B to_len][to][12B nonce][16B tag][ciphertext]
```

All fields are binary. The `from` and `to` are UTF-8 encoded node IDs. Header overhead is fixed at `4 + 4 + 12 + 16 = 36 bytes` plus the node ID lengths.

## Components

| Module | Path | Description |
|--------|------|-------------|
| ChaCha Transport | `src/transport/chacha-transport.ts` | Encrypt/decrypt with AEAD + wire serialization |
| PeerManager | `src/peer/peer-manager.ts` | Connection lifecycle, heartbeat, dead peer detection |
| StaticDiscovery | `src/discovery/static-discovery.ts` | In-memory peer registry |
| MeshNode | `src/node/mesh-node.ts` | Core node with topic routing + encrypted send |
| Types | `src/types.ts` | MeshNodeInfo, MeshMessage, PeerConnection, MeshConfig |

## Tests

```bash
npx vitest run    # 23 tests
```

Covers: ChaCha20-Poly1305 round-trip, tamper detection, wrong key rejection, wire format serialization, unicode payloads, large payloads, peer management (add/remove/heartbeat/key-wipe), static discovery, MeshNode lifecycle, topic subscriptions, wildcard handlers, and peer discovery.

## Zero External Dependencies

All operations use Node.js built-in modules:
- `node:crypto` — `createCipheriv('chacha20-poly1305')`, `randomBytes`, `randomUUID`
- No network libraries required — transport layer is pluggable (TCP, QUIC, WebSocket, etc.)
