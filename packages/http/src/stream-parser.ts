/**
 * @gao/http — Stream Parser
 *
 * Zero-copy body parsing using ReadableStream.
 * Avoids the double-allocation of Request.clone() + json().
 *
 * Key principles (Apple-inspired):
 * - Read chunks directly from the stream (no clone)
 * - Single TextDecoder pass at the end
 * - Single-chunk fast path avoids concatenation entirely
 * - maxSize enforcement during streaming (fail-fast)
 */

/**
 * Parse a JSON body from a Request's ReadableStream.
 * Does NOT clone the request — consumes the body directly.
 *
 * @param request - The native Request object.
 * @param maxSize - Maximum body size in bytes. Default: 1MB.
 * @returns Parsed JSON object, or empty object on error.
 */
export async function parseJsonStream(
    request: Request,
    maxSize = 1_048_576,
): Promise<unknown> {
    const body = request.body;
    if (!body) return {};

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            totalSize += value.byteLength;
            if (totalSize > maxSize) {
                reader.cancel();
                throw new BodyTooLargeError(totalSize, maxSize);
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    if (chunks.length === 0) return {};

    const decoder = new TextDecoder();
    // Single-chunk fast path: decode directly, no concatenation
    const text =
        chunks.length === 1
            ? decoder.decode(chunks[0])
            : decoder.decode(concatUint8Arrays(chunks, totalSize));

    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
}

/**
 * Parse a URL-encoded form body from a Request's ReadableStream.
 * Does NOT clone the request.
 *
 * @param request - The native Request object.
 * @param maxSize - Maximum body size in bytes. Default: 1MB.
 * @returns Record of form field key-value pairs.
 */
export async function parseFormStream(
    request: Request,
    maxSize = 1_048_576,
): Promise<Record<string, string>> {
    const body = request.body;
    if (!body) return {};

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            totalSize += value.byteLength;
            if (totalSize > maxSize) {
                reader.cancel();
                throw new BodyTooLargeError(totalSize, maxSize);
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    if (chunks.length === 0) return {};

    const decoder = new TextDecoder();
    const text =
        chunks.length === 1
            ? decoder.decode(chunks[0])
            : decoder.decode(concatUint8Arrays(chunks, totalSize));

    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}

/**
 * Read the raw text body from a Request's ReadableStream.
 * Does NOT clone the request.
 */
export async function parseTextStream(
    request: Request,
    maxSize = 1_048_576,
): Promise<string> {
    const body = request.body;
    if (!body) return '';

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            totalSize += value.byteLength;
            if (totalSize > maxSize) {
                reader.cancel();
                throw new BodyTooLargeError(totalSize, maxSize);
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    if (chunks.length === 0) return '';

    const decoder = new TextDecoder();
    return chunks.length === 1
        ? decoder.decode(chunks[0])
        : decoder.decode(concatUint8Arrays(chunks, totalSize));
}

// ─── Utilities ───────────────────────────────────────────────

/**
 * Concatenate multiple Uint8Arrays into a single one.
 * Pre-allocates the target buffer using known total size.
 */
function concatUint8Arrays(
    arrays: Uint8Array[],
    totalLength: number,
): Uint8Array {
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.byteLength;
    }
    return result;
}

export class BodyTooLargeError extends Error {
    public readonly statusCode = 413;
    public readonly code = 'BODY_TOO_LARGE';
    public readonly received: number;
    public readonly limit: number;

    constructor(received: number, limit: number) {
        super(`Request body too large: ${received} bytes exceeds limit of ${limit} bytes`);
        this.name = 'BodyTooLargeError';
        this.received = received;
        this.limit = limit;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
