/**
 * @gao/http — File Upload Handler
 *
 * HTTP-layer multipart parsing using `busboy`.
 * Streams uploads to disk to prevent memory overflow.
 * Also provides UploadedFile class with utility methods.
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
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
  /** Maximum number of files. Default: 10. */
  maxFiles?: number;
}

/**
 * Represents an uploaded file with utility methods.
 */
export class UploadedFile {
  public readonly fieldname: string;
  public readonly originalName: string;
  public readonly encoding: string;
  public readonly mimeType: string;
  public readonly tempFilePath: string;
  public readonly size: number;

  constructor(data: {
    fieldname: string;
    originalName: string;
    encoding: string;
    mimeType: string;
    tempFilePath: string;
    size: number;
  }) {
    this.fieldname = data.fieldname;
    this.originalName = data.originalName;
    this.encoding = data.encoding;
    this.mimeType = data.mimeType;
    this.tempFilePath = data.tempFilePath;
    this.size = data.size;
  }

  /** File extension (e.g., '.jpg') */
  get extension(): string {
    return path.extname(this.originalName);
  }

  /** File name without extension */
  get name(): string {
    return path.basename(this.originalName, this.extension);
  }

  /**
   * Move/copy the temp file to a permanent location.
   * @param destPath Absolute path or directory to save to
   * @returns Final file path
   */
  async saveTo(destPath: string): Promise<string> {
    try {
      const stat = await fsPromises.stat(destPath);
      if (stat.isDirectory()) {
        destPath = path.join(destPath, this.originalName);
      }
    } catch {
      // Path doesn't exist yet, treat as file path
    }

    const dir = path.dirname(destPath);
    await fsPromises.mkdir(dir, { recursive: true });

    // Copy from temp to dest, then remove temp
    await fsPromises.copyFile(this.tempFilePath, destPath);
    await fsPromises.unlink(this.tempFilePath).catch(() => { });

    return destPath;
  }

  /**
   * Read the file contents as a Buffer.
   */
  async toBuffer(): Promise<Buffer> {
    return fsPromises.readFile(this.tempFilePath);
  }

  /**
   * Convert the file to a Base64 string.
   */
  async toBase64(): Promise<string> {
    const buffer = await this.toBuffer();
    return buffer.toString('base64');
  }

  /**
   * Convert to a data URI string (e.g., for embedding in HTML).
   */
  async toDataUri(): Promise<string> {
    const base64 = await this.toBase64();
    return `data:${this.mimeType};base64,${base64}`;
  }

  /**
   * Delete the temporary file.
   */
  async cleanup(): Promise<void> {
    await fsPromises.unlink(this.tempFilePath).catch(() => { });
  }
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
      files: options.maxFiles ?? 10,
    },
  });

  const result: UploadResult = {
    fields: {},
    files: [],
  };

  return new Promise(async (resolve, reject) => {
    const cleanupTempFiles = () => {
      for (const file of result.files) {
        fs.unlink(file.tempFilePath, () => { });
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
        result.files.push(
          new UploadedFile({
            fieldname,
            originalName: filename,
            encoding,
            mimeType,
            tempFilePath,
            size,
          }),
        );
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
    const bodyArrayBuffer = await req.native.arrayBuffer();
    bb.end(Buffer.from(bodyArrayBuffer));
  });
}
