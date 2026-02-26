/**
 * @gao/email — Public API
 */

// ─── Core Classes ────────────────────────────────────────────
export { Mailer, createMailer } from './mailer.js';

// ─── Templates ───────────────────────────────────────────────
export { compileTemplate } from './template.js';
export {
    BUILT_IN_TEMPLATES,
    WELCOME_TEMPLATE,
    RESET_PASSWORD_TEMPLATE,
    VERIFICATION_TEMPLATE,
} from './templates.js';

// ─── Plugin ──────────────────────────────────────────────────
export { emailPlugin } from './plugin.js';

// ─── Types ───────────────────────────────────────────────────
export type {
    EmailConfig,
    EmailFromConfig,
    SmtpConfig,
    SendEmailOptions,
    EmailAttachment,
    EmailResult,
    QueueSendFn,
} from './types.js';
