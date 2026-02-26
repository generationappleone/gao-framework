import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { GaoRequest } from '../src/request.js';
import { parseMultipart } from '../src/upload.js';

describe('File Upload Handler', () => {
  it('should throw an error if content type is not multipart', async () => {
    const req = new GaoRequest(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    );

    await expect(parseMultipart(req)).rejects.toThrow(/must be multipart\/form-data/);
  });

  it('should parse valid multipart payload into fields and files on disk', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="username"\r\n\r\nalice\r\n--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\nfake-image-data\r\n--${boundary}--\r\n`;

    const req = new GaoRequest(
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      }),
    );

    const result = await parseMultipart(req, { destDir: os.tmpdir() });

    expect(result.fields['username']).toBe('alice');
    expect(result.files).toHaveLength(1);

    const file = result.files[0]!;
    expect(file.fieldname).toBe('avatar');
    expect(file.originalName).toBe('avatar.png');
    expect(file.mimeType).toBe('image/png');
    expect(file.size).toBe(15); // 'fake-image-data'.length == 15

    // Check if file exists on disk
    expect(fs.existsSync(file.tempFilePath)).toBe(true);

    const content = fs.readFileSync(file.tempFilePath, 'utf8');
    expect(content).toBe('fake-image-data');

    // Cleanup
    fs.unlinkSync(file.tempFilePath);
  });

  it('should reject file if size exceeds limits and cleanup', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\nfake-image-data\r\n--${boundary}--\r\n`;

    const req = new GaoRequest(
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      }),
    );

    await expect(
      parseMultipart(req, {
        destDir: os.tmpdir(),
        maxFileSize: 5, // less than 'fake-image-data'.length
      }),
    ).rejects.toThrow(/File size exceeded limit/);
  });
});
