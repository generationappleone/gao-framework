import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Mailer } from '../src/mailer.js';
import type { EmailConfig } from '../src/types.js';

// Mock nodemailer
vi.mock('nodemailer', () => {
    const mockSendMail = vi.fn().mockResolvedValue({
        messageId: '<test-msg-id@example.com>',
    });
    const mockVerify = vi.fn().mockResolvedValue(true);
    const mockClose = vi.fn();

    return {
        default: {
            createTransport: vi.fn().mockReturnValue({
                sendMail: mockSendMail,
                verify: mockVerify,
                close: mockClose,
            }),
            createTestAccount: vi.fn().mockResolvedValue({
                user: 'test@ethereal.email',
                pass: 'test-pass',
            }),
            getTestMessageUrl: vi.fn().mockReturnValue(false),
        },
    };
});

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
});

const smtpConfig: EmailConfig = {
    from: { name: 'TestApp', address: 'noreply@test.com' },
    transport: 'smtp',
    smtp: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'smtp-user', pass: 'smtp-pass' },
    },
};

const etherealConfig: EmailConfig = {
    from: { name: 'TestApp', address: 'noreply@test.com' },
    transport: 'ethereal',
};

describe('Mailer', () => {
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        vi.clearAllMocks();
        logger = createMockLogger();
    });

    it('should initialize with SMTP transport', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();
        expect(logger.info).toHaveBeenCalledWith('Email transport: SMTP', {
            host: 'smtp.test.com',
            port: 587,
        });
    });

    it('should initialize with Ethereal transport', async () => {
        const mailer = new Mailer(etherealConfig, logger as any);
        await mailer.initialize();
        expect(logger.info).toHaveBeenCalledWith('Email transport: Ethereal (dev mode)', {
            user: 'test@ethereal.email',
        });
    });

    it('should throw if not initialized before sending', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await expect(
            mailer.send({ to: 'test@test.com', subject: 'Test' }),
        ).rejects.toThrow('Mailer not initialized');
    });

    it('should send an email successfully', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();

        const result = await mailer.send({
            to: 'user@example.com',
            subject: 'Hello',
            html: '<h1>Hello World</h1>',
        });

        expect(result.messageId).toBe('<test-msg-id@example.com>');
        expect(logger.info).toHaveBeenCalledWith('Email sent', {
            to: 'user@example.com',
            subject: 'Hello',
            messageId: '<test-msg-id@example.com>',
        });
    });

    it('should compile built-in templates', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();

        await mailer.send({
            to: 'user@example.com',
            subject: 'Welcome',
            template: 'welcome',
            data: { name: 'Alice', appName: 'TestApp', dashboardUrl: 'https://app.test.com' },
        });

        expect(logger.info).toHaveBeenCalledWith('Email sent', expect.any(Object));
    });

    it('should send to multiple recipients', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();

        await mailer.send({
            to: ['a@test.com', 'b@test.com'],
            subject: 'Multi',
            html: '<p>Test</p>',
        });

        expect(logger.info).toHaveBeenCalledWith('Email sent', expect.any(Object));
    });

    it('should fallback to direct send if queue not set', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();

        const result = await mailer.queue({
            to: 'user@test.com',
            subject: 'Queued',
            html: '<p>Test</p>',
        });

        expect(result).toBe('<test-msg-id@example.com>');
        expect(logger.warn).toHaveBeenCalledWith(
            'Queue function not set — sending email directly.',
        );
    });

    it('should use queue function when set', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();

        const mockQueueFn = vi.fn().mockResolvedValue('job-123');
        mailer.setQueueFunction(mockQueueFn);

        const result = await mailer.queue({
            to: 'user@test.com',
            subject: 'Queued',
            html: '<p>Test</p>',
        });

        expect(result).toBe('job-123');
        expect(mockQueueFn).toHaveBeenCalled();
    });

    it('should shutdown transport', async () => {
        const mailer = new Mailer(smtpConfig, logger as any);
        await mailer.initialize();
        mailer.shutdown();
        expect(logger.info).toHaveBeenCalledWith('Email transport closed.');
    });
});
