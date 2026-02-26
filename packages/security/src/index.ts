/**
 * @gao/security — Barrel Export
 *
 * Public API surface for @gao/security.
 */

// ─── Types ───────────────────────────────────────────────────
export type { HelmetOptions, CorsOptions, CorsOriginResolver } from './types.js';

// ─── Middleware ───────────────────────────────────────────────
export { helmet } from './middleware/helmet.js';
export { cors } from './middleware/cors.js';
export { csrf, generateCsrfSecret, createCsrfToken, verifyCsrfToken } from './middleware/csrf.js';
export type { CsrfOptions } from './middleware/csrf.js';
export { rateLimiter, MemoryRateLimiterStore } from './middleware/rate-limiter.js';
export type { RateLimiterOptions, RateLimiterStore } from './middleware/rate-limiter.js';
export { validate } from './middleware/validator.js';
export type { ValidatorOptions } from './middleware/validator.js';
export { xssGuard, htmlEncode, sanitizeHtml, generateCspNonce } from './middleware/xss-guard.js';
export type { XssGuardOptions } from './middleware/xss-guard.js';
export { ddosShield } from './middleware/ddos-shield.js';
export type { DdosShieldOptions } from './middleware/ddos-shield.js';
export { secureUpload, sanitizeFilename } from './middleware/upload.js';
export type { UploadOptions, UploadedFile } from './middleware/upload.js';
export { captchaShield, TurnstileProvider, RecaptchaV3Provider } from './middleware/captcha.js';
export type { CaptchaOptions, CaptchaProvider } from './middleware/captcha.js';

// ─── Crypto ───────────────────────────────────────────────────
export { hashPassword, verifyPassword, needsRehash } from './crypto/hashing.js';
export type { HashingOptions } from './crypto/hashing.js';
export { encrypt, decrypt, deriveKey } from './crypto/aes256.js';
export type { AesOptions } from './crypto/aes256.js';
export {
  Encrypted,
  encryptFields,
  decryptFields,
  ENCRYPTED_FIELDS_META_KEY,
} from './crypto/field-encrypt.js';
export type { EncryptedFieldOptions, EncryptedFieldRegistry } from './crypto/field-encrypt.js';

// ─── Auth ─────────────────────────────────────────────────────
export { JwtService, MemoryRevocationAdapter } from './auth/jwt.js';
export type { JwtConfig, JwtTokens, TokenRevocationAdapter } from './auth/jwt.js';
export { RbacEngine } from './auth/rbac.js';
export type { RbacConfig, RoleNode } from './auth/rbac.js';
export { guard } from './auth/guard.js';
export type { AuthGuardOptions, GuardType } from './auth/guard.js';
