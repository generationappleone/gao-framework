/**
 * @gao/email — Mailer
 *
 * Sends transactional emails via configurable transport.
 * Optional queue integration for async sending.
 * Follows SRP: only handles email sending + queue dispatch.
 */

import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import type { Logger } from '@gao/core';
import type { EmailConfig, SendEmailOptions, EmailResult, QueueSendFn } from './types.js';
import { compileTemplate } from './template.js';
import { BUILT_IN_TEMPLATES } from './templates.js';

export class Mailer {
    private transporter: Transporter | undefined;
    private queueFn: QueueSendFn | undefined;

    constructor(
        private readonly config: EmailConfig,
        private readonly logger: Logger,
    ) { }

    /**
     * Initialize the mail transport.
     * Must be called before send().
     */
    async initialize(): Promise<void> {
        if (this.config.transport === 'ethereal') {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.logger.info('Email transport: Ethereal (dev mode)', {
                user: testAccount.user,
            });
        } else if (this.config.smtp) {
            this.transporter = nodemailer.createTransport({
                host: this.config.smtp.host,
                port: this.config.smtp.port,
                secure: this.config.smtp.secure ?? false,
                auth: this.config.smtp.auth
                    ? { user: this.config.smtp.auth.user, pass: this.config.smtp.auth.pass }
                    : undefined,
            });
            this.logger.info('Email transport: SMTP', {
                host: this.config.smtp.host,
                port: this.config.smtp.port,
            });
        } else {
            throw new Error(
                'Email transport not configured. Provide smtp config or set transport to "ethereal".',
            );
        }

        // Verify connection
        try {
            await this.transporter.verify();
            this.logger.info('Email transport verified successfully.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Email transport verification failed: ${message}`);
        }
    }

    /**
     * Set the queue function for async email sending.
     * Typically called by the emailPlugin when @gao/queue is available.
     */
    setQueueFunction(fn: QueueSendFn): void {
        this.queueFn = fn;
        this.logger.debug('Email queue integration enabled.');
    }

    /**
     * Send an email immediately.
     */
    async send(options: SendEmailOptions): Promise<EmailResult> {
        if (!this.transporter) {
            throw new Error('Mailer not initialized. Call initialize() first.');
        }

        // Resolve template
        let html = options.html ?? '';
        if (options.template) {
            const templateStr = BUILT_IN_TEMPLATES[options.template] ?? options.template;
            html = compileTemplate(templateStr, options.data ?? {});
        }

        const mailOptions: SendMailOptions = {
            from: `"${this.config.from.name}" <${this.config.from.address}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html,
            text: options.text,
            cc: options.cc
                ? Array.isArray(options.cc)
                    ? options.cc.join(', ')
                    : options.cc
                : undefined,
            bcc: options.bcc
                ? Array.isArray(options.bcc)
                    ? options.bcc.join(', ')
                    : options.bcc
                : undefined,
            replyTo: options.replyTo,
            attachments: options.attachments?.map((a) => ({
                filename: a.filename,
                content: a.content,
                contentType: a.contentType,
            })),
        };

        const info = await this.transporter.sendMail(mailOptions);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            this.logger.info(`Email preview URL: ${previewUrl as string}`);
        }

        this.logger.info('Email sent', {
            to: options.to,
            subject: options.subject,
            messageId: info.messageId,
        });

        return {
            messageId: info.messageId,
            previewUrl: (previewUrl || undefined) as string | undefined,
        };
    }

    /**
     * Queue an email for async sending (requires @gao/queue integration).
     * Falls back to direct sending if queue is not configured.
     */
    async queue(options: SendEmailOptions): Promise<string> {
        if (!this.queueFn) {
            this.logger.warn('Queue function not set — sending email directly.');
            const result = await this.send(options);
            return result.messageId;
        }
        return this.queueFn(options);
    }

    /**
     * Close the transport connection.
     */
    shutdown(): void {
        if (this.transporter) {
            this.transporter.close();
            this.logger.info('Email transport closed.');
        }
    }
}

/**
 * Factory function.
 */
export function createMailer(config: EmailConfig, logger: Logger): Mailer {
    return new Mailer(config, logger);
}
