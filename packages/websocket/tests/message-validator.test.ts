import { describe, it, expect } from 'vitest';
import { MessageValidator } from '../src/message-validator.js';

describe('MessageValidator', () => {
    // ── Size Validation ──────────────────────────────────────

    describe('size validation', () => {
        it('should accept payloads within size limit', () => {
            const validator = new MessageValidator({ maxPayloadBytes: 1024 });
            const result = validator.validate({ message: 'hello' });
            expect(result.valid).toBe(true);
        });

        it('should reject payloads exceeding size limit', () => {
            const validator = new MessageValidator({ maxPayloadBytes: 20 });
            const result = validator.validate({ message: 'this is a longer message that exceeds the limit' });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('too large');
            expect(result.reason).toContain('exceeds limit');
        });

        it('should use default limit of 64KB', () => {
            const validator = new MessageValidator();
            // Small payload should pass
            const result = validator.validate({ key: 'value' });
            expect(result.valid).toBe(true);
        });

        it('should reject payloads at the boundary', () => {
            // Create a string that will just exceed the limit when serialized
            const validator = new MessageValidator({ maxPayloadBytes: 30 });
            const result = validator.validate({ data: 'a'.repeat(20) });
            // JSON: {"data":"aaaaa..."} ≈ 30+ chars × 2 bytes = 60+ bytes > 30
            expect(result.valid).toBe(false);
        });
    });

    // ── XSS Sanitization ─────────────────────────────────────

    describe('string sanitization', () => {
        it('should encode HTML special characters', () => {
            const validator = new MessageValidator({ sanitizeStrings: true, maxPayloadBytes: 65536 });
            const result = validator.validate({ message: '<script>alert("xss")</script>' });

            expect(result.valid).toBe(true);
            const data = result.data as { message: string };
            expect(data.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        it('should sanitize ampersands', () => {
            const validator = new MessageValidator({ sanitizeStrings: true, maxPayloadBytes: 65536 });
            const result = validator.validate({ text: 'a & b' });
            const data = result.data as { text: string };
            expect(data.text).toBe('a &amp; b');
        });

        it('should sanitize single quotes', () => {
            const validator = new MessageValidator({ sanitizeStrings: true, maxPayloadBytes: 65536 });
            const result = validator.validate({ text: "it's dangerous" });
            const data = result.data as { text: string };
            expect(data.text).toBe('it&#x27;s dangerous');
        });

        it('should sanitize nested objects', () => {
            const validator = new MessageValidator({ sanitizeStrings: true, maxPayloadBytes: 65536 });
            const result = validator.validate({
                user: {
                    name: '<b>Bob</b>',
                    bio: 'Hello & welcome',
                },
            });

            const data = result.data as { user: { name: string; bio: string } };
            expect(data.user.name).toBe('&lt;b&gt;Bob&lt;/b&gt;');
            expect(data.user.bio).toBe('Hello &amp; welcome');
        });

        it('should sanitize arrays of strings', () => {
            const validator = new MessageValidator({ sanitizeStrings: true, maxPayloadBytes: 65536 });
            const result = validator.validate({
                tags: ['<script>', 'normal', '"quoted"'],
            });

            const data = result.data as { tags: string[] };
            expect(data.tags[0]).toBe('&lt;script&gt;');
            expect(data.tags[1]).toBe('normal');
            expect(data.tags[2]).toBe('&quot;quoted&quot;');
        });

        it('should preserve non-string primitives', () => {
            const validator = new MessageValidator({ sanitizeStrings: true, maxPayloadBytes: 65536 });
            const result = validator.validate({
                count: 42,
                active: true,
                data: null,
            });

            const data = result.data as { count: number; active: boolean; data: null };
            expect(data.count).toBe(42);
            expect(data.active).toBe(true);
            expect(data.data).toBeNull();
        });

        it('should not modify strings when sanitization is disabled', () => {
            const validator = new MessageValidator({ sanitizeStrings: false, maxPayloadBytes: 65536 });
            const result = validator.validate({ message: '<script>alert("xss")</script>' });

            const data = result.data as { message: string };
            expect(data.message).toBe('<script>alert("xss")</script>');
        });

        it('should enable sanitization by default', () => {
            const validator = new MessageValidator();
            const result = validator.validate({ text: '<b>bold</b>' });
            const data = result.data as { text: string };
            expect(data.text).toBe('&lt;b&gt;bold&lt;/b&gt;');
        });
    });

    // ── Edge Cases ───────────────────────────────────────────

    describe('edge cases', () => {
        it('should handle empty objects', () => {
            const validator = new MessageValidator();
            const result = validator.validate({});
            expect(result.valid).toBe(true);
        });

        it('should handle string primitives', () => {
            const validator = new MessageValidator();
            const result = validator.validate('hello <world>');
            expect(result.valid).toBe(true);
            expect(result.data).toBe('hello &lt;world&gt;');
        });

        it('should handle number primitives', () => {
            const validator = new MessageValidator();
            const result = validator.validate(42);
            expect(result.valid).toBe(true);
            expect(result.data).toBe(42);
        });

        it('should handle deeply nested objects', () => {
            const validator = new MessageValidator({ maxPayloadBytes: 65536 });
            const result = validator.validate({
                level1: {
                    level2: {
                        level3: {
                            value: '<img src=x onerror=alert(1)>',
                        },
                    },
                },
            });

            const data = result.data as { level1: { level2: { level3: { value: string } } } };
            expect(data.level1.level2.level3.value).toBe(
                '&lt;img src=x onerror=alert(1)&gt;',
            );
        });

        it('should handle undefined values in objects', () => {
            const validator = new MessageValidator();
            const result = validator.validate({ a: undefined, b: 'test' });
            expect(result.valid).toBe(true);
        });

        it('should handle mixed arrays', () => {
            const validator = new MessageValidator();
            const result = validator.validate({
                items: [1, '<b>text</b>', true, null, { nested: '<i>value</i>' }],
            });
            expect(result.valid).toBe(true);

            const data = result.data as { items: unknown[] };
            expect(data.items[0]).toBe(1);
            expect(data.items[1]).toBe('&lt;b&gt;text&lt;/b&gt;');
            expect(data.items[2]).toBe(true);
            expect(data.items[3]).toBeNull();
            expect((data.items[4] as { nested: string }).nested).toBe('&lt;i&gt;value&lt;/i&gt;');
        });
    });
});
