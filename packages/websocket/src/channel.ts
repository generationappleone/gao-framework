/**
 * @gao/websocket — Channel Manager
 *
 * Manages named channels (rooms) with membership tracking and options.
 * Follows SRP: only handles channel lifecycle.
 */

import type { Logger } from '@gao/core';
import type { ChannelOptions } from './types.js';

interface ChannelInfo {
    readonly name: string;
    readonly options: ChannelOptions;
    readonly members: Set<string>;
    readonly createdAt: number;
}

export class ChannelManager {
    private readonly channels = new Map<string, ChannelInfo>();

    constructor(private readonly logger: Logger) { }

    /**
     * Get or create a channel with the given options.
     */
    getOrCreate(name: string, options: ChannelOptions = {}): ChannelInfo {
        const existing = this.channels.get(name);
        if (existing) return existing;

        const channel: ChannelInfo = {
            name,
            options,
            members: new Set(),
            createdAt: Date.now(),
        };

        this.channels.set(name, channel);
        this.logger.debug(`Channel created: ${name}`);
        return channel;
    }

    /**
     * Add a socket to a channel.
     * Returns false if the channel is full (maxMembers reached).
     */
    join(channelName: string, socketId: string, options?: ChannelOptions): boolean {
        const channel = this.getOrCreate(channelName, options);

        if (
            channel.options.maxMembers !== undefined &&
            channel.members.size >= channel.options.maxMembers
        ) {
            this.logger.debug(`Channel ${channelName} is full — rejecting join`, {
                socketId,
                maxMembers: channel.options.maxMembers,
            });
            return false;
        }

        channel.members.add(socketId);
        this.logger.debug(`Socket joined channel: ${channelName}`, {
            socketId,
            memberCount: channel.members.size,
        });
        return true;
    }

    /**
     * Remove a socket from a channel.
     */
    leave(channelName: string, socketId: string): void {
        const channel = this.channels.get(channelName);
        if (!channel) return;

        channel.members.delete(socketId);
        this.logger.debug(`Socket left channel: ${channelName}`, {
            socketId,
            memberCount: channel.members.size,
        });

        // Auto-cleanup empty channels
        if (channel.members.size === 0) {
            this.channels.delete(channelName);
            this.logger.debug(`Channel removed (empty): ${channelName}`);
        }
    }

    /**
     * Remove a socket from ALL channels (called on disconnect).
     */
    leaveAll(socketId: string): string[] {
        const leftChannels: string[] = [];

        for (const [name, channel] of this.channels.entries()) {
            if (channel.members.has(socketId)) {
                channel.members.delete(socketId);
                leftChannels.push(name);

                if (channel.members.size === 0) {
                    this.channels.delete(name);
                }
            }
        }

        return leftChannels;
    }

    /**
     * Get all members of a channel.
     */
    getMembers(channelName: string): string[] {
        const channel = this.channels.get(channelName);
        return channel ? [...channel.members] : [];
    }

    /**
     * Get all channel names.
     */
    getChannelNames(): string[] {
        return [...this.channels.keys()];
    }

    /**
     * Get the member count for a channel.
     */
    getMemberCount(channelName: string): number {
        return this.channels.get(channelName)?.members.size ?? 0;
    }

    /**
     * Check if a channel exists.
     */
    hasChannel(name: string): boolean {
        return this.channels.has(name);
    }

    /**
     * Clear all channels.
     */
    clear(): void {
        this.channels.clear();
    }
}

export function createChannelManager(logger: Logger): ChannelManager {
    return new ChannelManager(logger);
}
