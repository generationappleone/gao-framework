/**
 * @gao/email — Type Definitions
 */

// ─── Config ──────────────────────────────────────────────────

export interface EmailFromConfig {
    readonly name: string;
    readonly address: string;
}

export interface SmtpConfig {
    readonly host: string;
    readonly port: number;
    readonly secure?: boolean;
    readonly auth?: {
        readonly user: string;
        readonly pass: string;
    };
}

export interface EmailConfig {
    readonly from: EmailFromConfig;
    readonly transport: 'smtp' | 'ethereal';
    readonly smtp?: SmtpConfig;
    readonly queue?: boolean;
}

// ─── Send Options ────────────────────────────────────────────

export interface SendEmailOptions {
    readonly to: string | string[];
    readonly subject: string;
    readonly html?: string;
    readonly text?: string;
    readonly template?: string;
    readonly data?: Record<string, unknown>;
    readonly cc?: string | string[];
    readonly bcc?: string | string[];
    readonly replyTo?: string;
    readonly attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    readonly filename: string;
    readonly content: string | Buffer;
    readonly contentType?: string;
}

// ─── Result ──────────────────────────────────────────────────

export interface EmailResult {
    readonly messageId: string;
    readonly previewUrl?: string;
}

// ─── Queue Integration ───────────────────────────────────────

export type QueueSendFn = (options: SendEmailOptions) => Promise<string>;
