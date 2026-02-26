import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createAuthMiddleware } from '../src/auth.js';
import type { AuthenticatedSocket } from '../src/auth.js';
import type { AuthVerifyFn } from '../src/types.js';

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
});

const createMockSocket = (
    authToken?: string,
    queryToken?: string,
): AuthenticatedSocket => ({
    id: 'socket-test',
    data: {},
    handshake: {
        auth: authToken ? { token: authToken } : {},
        query: queryToken ? { token: queryToken } : {},
    },
    disconnect: vi.fn(),
});

describe('Auth Middleware', () => {
    let logger: ReturnType<typeof createMockLogger>;
    let verifyFn: AuthVerifyFn;

    beforeEach(() => {
        vi.clearAllMocks();
        logger = createMockLogger();
        verifyFn = vi.fn().mockResolvedValue({ id: 'user-1', name: 'Alice' });
    });

    it('should authenticate with token from handshake auth', async () => {
        const middleware = createAuthMiddleware(verifyFn, logger as any);
        const socket = createMockSocket('valid-token');
        const next = vi.fn();

        await middleware(socket, next);

        expect(verifyFn).toHaveBeenCalledWith('valid-token');
        expect(socket.data.user).toEqual({ id: 'user-1', name: 'Alice' });
        expect(next).toHaveBeenCalledWith();
    });

    it('should authenticate with token from query', async () => {
        const middleware = createAuthMiddleware(verifyFn, logger as any);
        const socket = createMockSocket(undefined, 'query-token');
        const next = vi.fn();

        await middleware(socket, next);

        expect(verifyFn).toHaveBeenCalledWith('query-token');
        expect(next).toHaveBeenCalledWith();
    });

    it('should reject if no token provided', async () => {
        const middleware = createAuthMiddleware(verifyFn, logger as any);
        const socket = createMockSocket();
        const next = vi.fn();

        await middleware(socket, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect((next.mock.calls[0] as [Error])[0]?.message).toBe('Authentication required');
    });

    it('should reject if token is invalid', async () => {
        (verifyFn as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const middleware = createAuthMiddleware(verifyFn, logger as any);
        const socket = createMockSocket('invalid-token');
        const next = vi.fn();

        await middleware(socket, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect((next.mock.calls[0] as [Error])[0]?.message).toBe('Invalid or expired token');
    });

    it('should handle verification errors gracefully', async () => {
        (verifyFn as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('JWT decode failed'));
        const middleware = createAuthMiddleware(verifyFn, logger as any);
        const socket = createMockSocket('broken-token');
        const next = vi.fn();

        await middleware(socket, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect((next.mock.calls[0] as [Error])[0]?.message).toBe('Authentication failed');
        expect(logger.error).toHaveBeenCalled();
    });
});
