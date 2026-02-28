/**
 * @gao/mesh — Static Discovery Provider
 *
 * A simple discovery provider that uses a static list of known peers.
 * Suitable for small deployments or when using environment-based service discovery.
 */

import type { DiscoveryProvider, MeshNodeInfo } from '../types.js';

export class StaticDiscovery implements DiscoveryProvider {
    readonly name = 'StaticDiscovery';
    private readonly nodes = new Map<string, MeshNodeInfo>();

    constructor(initialPeers?: MeshNodeInfo[]) {
        if (initialPeers) {
            for (const peer of initialPeers) {
                this.nodes.set(peer.nodeId, peer);
            }
        }
    }

    async register(node: MeshNodeInfo): Promise<void> {
        this.nodes.set(node.nodeId, node);
    }

    async deregister(nodeId: string): Promise<void> {
        this.nodes.delete(nodeId);
    }

    async discover(): Promise<MeshNodeInfo[]> {
        return Array.from(this.nodes.values());
    }

    /**
     * Get a specific node by ID.
     */
    getNode(nodeId: string): MeshNodeInfo | undefined {
        return this.nodes.get(nodeId);
    }

    /**
     * Get total number of registered nodes.
     */
    get size(): number {
        return this.nodes.size;
    }
}
