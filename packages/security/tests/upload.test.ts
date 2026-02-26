import type { GaoContext } from '@gao/core';
import { ValidationError } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import { sanitizeFilename, secureUpload } from '../src/middleware/upload.js';

describe('Secure Upload Utilities', () => {
  it('should sanitize dangerous filenames', () => {
    const dangerous = '../../../etc/passwd';
    const safe = sanitizeFilename(dangerous);
    expect(safe).not.toContain('../');
    expect(safe).toContain('passwd');
    expect(safe).toMatch(/^[a-f0-9]{16}_passwd$/);
  });

  it('should strip null bytes and invalid chars', () => {
    const dangerous = 'file\0name!@#.png';
    const safe = sanitizeFilename(dangerous);
    expect(safe).not.toContain('\0');
    expect(safe).not.toContain('!@#');
    expect(safe).toMatch(/_file_name___\.png$/);
  });
});

describe('Secure Upload Middleware', () => {
  // Valid PNG Magic Bytes: 89 50 4E 47
  const validPngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  // Random invalid bytes
  const invalidBuffer = Buffer.from('1234567800000000', 'hex');

  it('should reject file exceeding max size', async () => {
    const middleware = secureUpload({ maxSizeBytes: 5 }); // 5 bytes
    const ctx = {
      metadata: {
        request: {
          headers: { 'content-type': 'multipart/form-data; boundary=something' },
          body: { file: { buffer: validPngBuffer, filename: 'test.png' } },
        },
      },
    } as unknown as GaoContext;

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(ValidationError);
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(
      'File exceeds maximum allowed size',
    );
  });

  it('should reject file with spoofed MIME type (invalid magic bytes)', async () => {
    const middleware = secureUpload({ allowedMimeTypes: ['image/png'] });
    const ctx = {
      metadata: {
        request: {
          headers: { 'content-type': 'multipart/form-data; boundary=something' },
          body: { file: { buffer: invalidBuffer, filename: 'fake.png' } },
        },
      },
    } as unknown as GaoContext;

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(ValidationError);
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(
      'Invalid file type or MIME type spoofing detected',
    );
  });

  it('should accept valid file and inject safe upload data to context', async () => {
    const middleware = secureUpload({ allowedMimeTypes: ['image/png'] });
    const ctx = {
      metadata: {
        request: {
          headers: { 'content-type': 'multipart/form-data; boundary=something' },
          body: { file: { buffer: validPngBuffer, filename: '../test.png' } },
        },
      },
    } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    const uploaded = ctx.metadata.uploadedFile as any;
    expect(uploaded).toBeDefined();
    expect(uploaded.originalName).toBe('../test.png');
    expect(uploaded.safeName).not.toContain('../');
    expect(uploaded.mimeType).toBe('image/png');
    expect(uploaded.size).toBe(validPngBuffer.length);
    expect(uploaded.buffer).toBe(validPngBuffer);
  });
});
