import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '../src/logger.js';

describe('Logger', () => {
  it('should create a logger with default options', () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  it('should create child logger', () => {
    const logger = createLogger();
    const child = logger.child({ reqId: '123' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
    expect(child).not.toBe(logger);
  });
});
