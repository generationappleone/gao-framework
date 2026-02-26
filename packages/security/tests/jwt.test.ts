import { describe, expect, it } from 'vitest';
import { JwtService } from '../src/auth/jwt.js';

describe('JWT Auth Service', () => {
  const secretKey = new TextEncoder().encode('super-secret-key-that-must-be-min-256-bits'); // 256+ bits
  const service = new JwtService({ secretKey });

  it('should generate an access token and refresh token that are unique', async () => {
    const tokens = await service.generateTokens('user-12345', { role: 'admin' });

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });

  it('should verify a valid access token', async () => {
    const tokens = await service.generateTokens('user-12345', { role: 'admin' });

    const payload = await service.verify(tokens.accessToken, 'access');
    expect(payload.sub).toBe('user-12345');
    expect(payload.type).toBe('access');
    expect(payload.role).toBe('admin');
  });

  it('should reject a refresh token when access expected', async () => {
    const tokens = await service.generateTokens('user-123');

    await expect(service.verify(tokens.refreshToken, 'access')).rejects.toThrow(
      'Invalid token type',
    );
  });

  it('should reject tampered tokens', async () => {
    const tokens = await service.generateTokens('user-123');
    const parts = tokens.accessToken.split('.');

    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'user-999', type: 'access' }),
    ).toString('base64url');
    // Swap the payload
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    await expect(service.verify(tamperedToken, 'access')).rejects.toThrow();
  });

  it('should fail validation without throwing when calling isValid', async () => {
    expect(await service.isValid('fake.token.data', 'access')).toBe(false);
  });

  it('should revoke a token and subsequently fail verification', async () => {
    const tokens = await service.generateTokens('user-123');

    // First it works
    expect(await service.isValid(tokens.accessToken)).toBe(true);

    // Revoke
    await service.revokeToken(tokens.accessToken);

    // Now it fails
    expect(await service.isValid(tokens.accessToken)).toBe(false);
    await expect(service.verify(tokens.accessToken)).rejects.toThrow('revoked');
  });
});
