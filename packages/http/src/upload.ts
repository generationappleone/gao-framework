/**
 * @gao/http — File Upload Handler
 *
 * HTTP-layer multipart parsing using `busboy`.
 * Streams uploads to disk to prevent memory overflow.
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import busboy from 'busboy';
import type { GaoRequest } from './request.js';

export interface UploadOptions {
  /** Directory to store temp files. Default: os.tmpdir() */
  destDir?: string;
  /** Max file size in bytes */
  maxFileSize?: number;
  /** Allowed mimetypes. E.g., ['image/png', 'image/jpeg'] */
  allowedMimeTypes?: string[];
}

export interface UploadedFile {
  fieldname: string;
  originalName: string;
  encoding: string;
  mimeType: string;
  tempFilePath: string;
  size: number;
}

export interface UploadResult {
  fields: Record<string, string>;
  files: UploadedFile[];
}

/**
 * Parses multipart/form-data from a Request object.
 */
export async function parseMultipart(
  req: GaoRequest,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const contentType = req.native.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Request must be multipart/form-data');
  }

  const destDir = options.destDir || '/tmp';
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Busboy requires headers object with lowercased keys.
  const headers: Record<string, string> = {};
  req.native.headers.forEach((val, key) => {
    headers[key.toLowerCase()] = val;
  });

  const bb = busboy({
    headers,
    limits: {
      fileSize: options.maxFileSize,
    },
  });

  const result: UploadResult = {
    fields: {},
    files: [],
  };

  return new Promise(async (resolve, reject) => {
    const cleanupTempFiles = () => {
      for (const file of result.files) {
        fs.unlink(file.tempFilePath, () => {});
      }
    };

    let pendingFiles = 0;
    let isBusboyFinished = false;

    const checkDone = () => {
      if (isBusboyFinished && pendingFiles === 0) {
        resolve(result);
      }
    };

    bb.on('file', (fieldname, fileStream, info) => {
      const { filename, encoding, mimeType } = info;
      pendingFiles++;

      if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
        // Reject
        fileStream.resume(); // drain
        cleanupTempFiles();
        return reject(new Error(`File type ${mimeType} not allowed`));
      }

      const tempFilePath = path.join(destDir, `${randomUUID()}-${filename}`);
      const writeStream = fs.createWriteStream(tempFilePath);
      let size = 0;

      fileStream.on('data', (data) => {
        size += data.length;
      });

      fileStream.on('limit', () => {
        fileStream.resume(); // drain remainder
        cleanupTempFiles();
        reject(new Error(`File size exceeded limit of ${options.maxFileSize} bytes`));
      });

      fileStream.pipe(writeStream);

      writeStream.on('finish', () => {
        result.files.push({
          fieldname,
          originalName: filename,
          encoding,
          mimeType,
          tempFilePath,
          size,
        });
        pendingFiles--;
        checkDone();
      });

      writeStream.on('error', (err) => {
        cleanupTempFiles();
        reject(err);
      });
    });

    bb.on('field', (fieldname, val) => {
      result.fields[fieldname] = val;
    });

    bb.on('finish', () => {
      isBusboyFinished = true;
      checkDone();
    });

    bb.on('error', (err: any) => {
      cleanupTempFiles();
      reject(err);
    });

    // Pipe the body into busboy.
    // For node 20 Web Streams Request, req.body is a ReadableStream.
    const bodyArrayBuffer = await req.native.arrayBuffer();
    bb.end(Buffer.from(bodyArrayBuffer));
  });
}
