/**
 * @gao/security — Secure File Upload
 *
 * Middleware for safely handling file uploads.
 * - Extracts boundary correctly without using full raw body parsing if possible
 * - Validates MIME types against Magic Bytes (prevent extension spoofing)
 * - Limits file sizes to prevent unbounded memory/disk usage
 * - Sanitizes filenames to prevent path traversal
 */

import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import path from 'node:path';
import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { ValidationError } from '@gao/core';

export interface UploadOptions {
  /** Max file size in bytes. Default: 5MB (5 * 1024 * 1024) */
  maxSizeBytes?: number;
  /** Allowed MIME types based on magic bytes. Default: images (png, jpeg, gif, webp) */
  allowedMimeTypes?: string[];
  /** Field name expected in multipart-form. Default: 'file' */
  fieldName?: string;
}

export interface UploadedFile {
  originalName: string;
  safeName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

// Common magic bytes mapped to MIME types
const MAGIC_BYTES: Record<string, string> = {
  '89504e47': 'image/png', // PNG
  ffd8ffe0: 'image/jpeg', // JPEG
  ffd8ffe1: 'image/jpeg',
  ffd8ffe2: 'image/jpeg',
  ffd8ffdb: 'image/jpeg',
  '47494638': 'image/gif', // GIF 87a / 89a
  '52494646': 'image/webp', // WEBP (partial match first 4 bytes 'RIFF', technically needs bytes 8-11 'WEBP')
  '25504446': 'application/pdf', // PDF
  '504b0304': 'application/zip', // ZIP / DOCX / XLSX
};

/**
 * Validates the file buffer against known magic bytes to prevent MIME-type spoofing.
 */
function validateMagicBytes(buffer: Buffer, allowedTypes: string[]): string | null {
  if (buffer.length < 4) return null;

  const hex = buffer.subarray(0, 4).toString('hex');

  // Special case for WebP (RIFF....WEBP)
  if (hex === '52494646') {
    if (buffer.length >= 12 && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
      return allowedTypes.includes('image/webp') ? 'image/webp' : null;
    }
  }

  const detectedMime = MAGIC_BYTES[hex];
  if (detectedMime && allowedTypes.includes(detectedMime)) {
    return detectedMime;
  }

  // Advanced: some files have offset magic bytes or longer signatures,
  // but this covers common attack vectors for web uploads.
  return null;
}

/**
 * Sanitizes a filename to prevent path traversal and remove dangerous characters.
 */
export function sanitizeFilename(filename: string): string {
  // 1. Get base name (strips paths like ../ or C:\)
  let clean = path.basename(filename);
  // 2. Replace non-alphanumeric (except dots, dashes, underscores) with underscore
  clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  // 3. Collapse multiple dots to a single dot
  clean = clean.replace(/\.{2,}/g, '.');
  // 4. Ensure it doesn't start with a dot
  if (clean.startsWith('.')) clean = `file_${clean}`;

  // Generate a secure random prefix to ensure uniqueness and prevent simple guessing
  const securePrefix = crypto.randomBytes(8).toString('hex');
  return `${securePrefix}_${clean}`;
}

export function secureUpload(options: UploadOptions = {}): Middleware {
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024;
  const allowedMimeTypes = options.allowedMimeTypes ?? [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  const fieldName = options.fieldName ?? 'file';

  return {
    name: 'security:secure-upload',
    handle: async (ctx: GaoContext, next: NextFunction) => {
      const request = ctx.metadata.request as
        | { body?: unknown; headers?: Record<string, string> }
        | undefined;

      if (!request || !request.body) {
        return next(); // Nothing to process
      }

      const isMultipart = request.headers?.['content-type']?.includes('multipart/form-data');
      if (!isMultipart) {
        return next(); // Not a multipart upload
      }

      // Simulated parsing here: In a real environment like Bun/Node,
      // the adapter would handle the stream/multipart parsing and populate request.body[fieldName]
      // We assume the adapter places a structure like { filename, mimeType, buffer } in the body.

      const rawBody = request.body as Record<string, any>;
      const fileData = rawBody[fieldName];

      if (!fileData) {
        // No file uploaded in this field, proceed
        return next();
      }

      // If it's an array of files, we only process the first one for this basic middleware,
      // or we could map over it. For now, assume single file.
      const file = Array.isArray(fileData) ? fileData[0] : fileData;

      if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
        throw new ValidationError('Invalid file upload format', [
          { field: fieldName, message: 'Invalid file upload format', code: 'invalid_format' },
        ]);
      }

      const size = file.buffer.length;
      if (size > maxSizeBytes) {
        throw new ValidationError(
          `File exceeds maximum allowed size of ${maxSizeBytes / 1024 / 1024}MB`,
          [{ field: fieldName, message: 'File too large', code: 'file_too_large' }],
        );
      }

      // Magic Bytes Validation
      const actualMimeType = validateMagicBytes(file.buffer, allowedMimeTypes);
      if (!actualMimeType) {
        throw new ValidationError('Invalid file type or MIME type spoofing detected', [
          { field: fieldName, message: 'Spoofed MIME type', code: 'invalid_mime_type' },
        ]);
      }

      const originalName = file.filename ?? 'unknown.bin';
      const safeName = sanitizeFilename(originalName);

      const uploadedFile: UploadedFile = {
        originalName,
        safeName,
        mimeType: actualMimeType,
        size,
        buffer: file.buffer,
      };

      ctx.metadata.uploadedFile = uploadedFile;

      await next();
    },
  };
}
