import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../src/ring-buffer.js';

describe('RingBuffer', () => {
    it('should push and retrieve items', () => {
        const buf = new RingBuffer<number>(5);
        buf.push(1);
        buf.push(2);
        buf.push(3);
        expect(buf.toArray()).toEqual([1, 2, 3]);
        expect(buf.size).toBe(3);
    });

    it('should overwrite oldest on overflow', () => {
        const buf = new RingBuffer<number>(3);
        buf.push(1);
        buf.push(2);
        buf.push(3);
        buf.push(4); // overwrites 1
        expect(buf.toArray()).toEqual([2, 3, 4]);
        expect(buf.size).toBe(3);
        expect(buf.isFull).toBe(true);
    });

    it('should return last item', () => {
        const buf = new RingBuffer<string>(3);
        expect(buf.last()).toBeUndefined();
        buf.push('a');
        buf.push('b');
        expect(buf.last()).toBe('b');
    });

    it('should return last N items', () => {
        const buf = new RingBuffer<number>(5);
        buf.push(10);
        buf.push(20);
        buf.push(30);
        buf.push(40);
        expect(buf.lastN(2)).toEqual([30, 40]);
        expect(buf.lastN(10)).toEqual([10, 20, 30, 40]); // clamp
    });

    it('should clear all items', () => {
        const buf = new RingBuffer<number>(5);
        buf.push(1);
        buf.push(2);
        buf.clear();
        expect(buf.size).toBe(0);
        expect(buf.toArray()).toEqual([]);
    });

    it('should report capacity', () => {
        const buf = new RingBuffer<number>(100);
        expect(buf.maxCapacity).toBe(100);
    });

    it('should handle single-capacity buffer', () => {
        const buf = new RingBuffer<string>(1);
        buf.push('a');
        buf.push('b');
        expect(buf.toArray()).toEqual(['b']);
        expect(buf.size).toBe(1);
    });

    it('should maintain chronological order after many overwrites', () => {
        const buf = new RingBuffer<number>(3);
        for (let i = 1; i <= 10; i++) buf.push(i);
        expect(buf.toArray()).toEqual([8, 9, 10]);
    });
});
