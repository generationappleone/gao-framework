/**
 * @gao/security — JWT Authentication Service
 *
 * Provides access token and refresh token generation, verification, and revocation.
 * Uses `jose` library for robust cryptographic signing (RS256, HS256).
 */

import { type JWTPayload, type KeyLike, SignJWT, jwtVerify } from 'jose';

export interface JwtConfig {
  /** The issuer claim (iss). Default: 'gao-auth' */
  issuer?: string;
  /** The audience claim (aud). Default: 'gao-app' */
  audience?: string;
  /** Secret or Private Key for signing. Provide string/Buffer for HMAC, KeyLike for RSA/ECDSA. */
  secretKey: Uint8Array | KeyLike;
  /** Access Token Expiration (e.g., '15m'). Default: '15m' */
  accessTokenTtl?: string;
  /** Refresh Token Expiration (e.g., '7d'). Default: '7d' */
  refreshTokenTtl?: string;
  /** JWT Algorithm. Default: 'HS256' */
  algorithm?: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRevocationAdapter {
  /** Mark a JTI (JWT ID) as revoked until its physical expiration. */
  revoke(jti: string, expiresAtMs: number): Promise<void>;
  /** Check if a JTI is revoked. */
  isRevoked(jti: string): Promise<boolean>;
}

export class MemoryRevocationAdapter implements TokenRevocationAdapter {
  private revokelist = new Map<string, number>();

  async revoke(jti: string, expiresAtMs: number): Promise<void> {
    this.revokelist.set(jti, expiresAtMs);
    // Cleanup expired entries
    const now = Date.now();
    for (const [id, exp] of this.revokelist) {
      if (exp <= now) this.revokelist.delete(id);
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    const expiresAt = this.revokelist.get(jti);
    if (!expiresAt) return false;

    if (expiresAt <= Date.now()) {
      this.revokelist.delete(jti);
      return false;
    }

    return true;
  }
}

export class JwtService {
  private config: JwtConfig;
  private revocation: TokenRevocationAdapter;

  constructor(
    config: JwtConfig,
    revocation: TokenRevocationAdapter = new MemoryRevocationAdapter(),
  ) {
    this.config = {
      issuer: 'gao-auth',
      audience: 'gao-app',
      accessTokenTtl: '15m',
      refreshTokenTtl: '7d',
      algorithm: 'HS256',
      ...config,
    };
    this.revocation = revocation;
  }

  /**
   * Generates a pair of access and refresh tokens.
   */
  async generateTokens(
    subjectId: string,
    payload: Record<string, unknown> = {},
  ): Promise<JwtTokens> {
    const crypto = await import('node:crypto');

    // Create random JTI (JWT ID) for revocation support
    const accessTokenJti = crypto.randomUUID();
    const refreshTokenJti = crypto.randomUUID();

    const accessToken = await new SignJWT({ ...payload, type: 'access' })
      .setProtectedHeader({ alg: this.config.algorithm as string })
      .setIssuedAt()
      .setIssuer(this.config.issuer as string)
      .setAudience(this.config.audience as string)
      .setSubject(subjectId)
      .setJti(accessTokenJti)
      .setExpirationTime(this.config.accessTokenTtl as string | number)
      .sign(this.config.secretKey);

    const refreshToken = await new SignJWT({ type: 'refresh' })
      .setProtectedHeader({ alg: this.config.algorithm as string })
      .setIssuedAt()
      .setIssuer(this.config.issuer as string)
      .setAudience(this.config.audience as string)
      .setSubject(subjectId)
      .setJti(refreshTokenJti)
      .setExpirationTime(this.config.refreshTokenTtl as string | number)
      .sign(this.config.secretKey);

    return { accessToken, refreshToken };
  }

  /**
   * Verifies a token and extracts its payload. Throws on invalid/expired/revoked tokens.
   */
  async verify(token: string, expectedType: 'access' | 'refresh' = 'access'): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, this.config.secretKey, {
      issuer: this.config.issuer,
      audience: this.config.audience,
    });

    if (payload.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType}, got ${payload.type}`);
    }

    if (payload.jti && (await this.revocation.isRevoked(payload.jti))) {
      throw new Error('Token has been revoked');
    }

    return payload;
  }

  /**
   * Revoke a specific token immediately using its JTI.
   */
  async revokeToken(token: string): Promise<void> {
    try {
      // Decode without verification just to extract JTI and EXP.
      // If we used verify(), we wouldn't be able to revoke an expired token (which is fine anyway).
      const { payload } = await jwtVerify(token, this.config.secretKey, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      if (payload.jti && payload.exp) {
        await this.revocation.revoke(payload.jti, payload.exp * 1000);
      }
    } catch {
      // Ignore invalid tokens during revocation
    }
  }

  /**
   * Check if a token is valid (doesn't throw).
   */
  async isValid(token: string, expectedType: 'access' | 'refresh' = 'access'): Promise<boolean> {
    try {
      await this.verify(token, expectedType);
      return true;
    } catch {
      return false;
    }
  }
}
