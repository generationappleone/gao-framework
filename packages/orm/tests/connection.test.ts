import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionManager } from '../src/connection.js';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';

describe('Connection Manager', () => {
  let mockDriver: DatabaseDriver;
  let manager: ConnectionManager;

  beforeEach(() => {
    mockDriver = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([{ healthy: 1 }]),
      execute: vi.fn(),
      transaction: vi.fn(),
    } as unknown as DatabaseDriver;

    manager = new ConnectionManager({
      driver: 'postgres',
      options: {},
      healthRetryCount: 3,
      healthRetryDelayMs: 10,
    });

    manager.setDriver(mockDriver);
  });

  it('should connect and perform a health check', async () => {
    await manager.connect();

    expect(mockDriver.connect).toHaveBeenCalledTimes(1);
    expect(mockDriver.query).toHaveBeenCalledWith('SELECT 1 as healthy');
    expect(() => manager.getDriver()).not.toThrow();
  });

  it('should retry on connection failure until limit', async () => {
    const connectMock = mockDriver.connect as unknown as ReturnType<typeof vi.fn>;
    // Fail twice, succeed on third
    connectMock
      .mockRejectedValueOnce(new Error('Network Error 1'))
      .mockRejectedValueOnce(new Error('Network Error 2'))
      .mockResolvedValueOnce(undefined);

    await manager.connect();

    expect(mockDriver.connect).toHaveBeenCalledTimes(3);
    expect(mockDriver.query).toHaveBeenCalledTimes(1);
  });

  it('should throw error if all retries fail', async () => {
    const connectMock = mockDriver.connect as unknown as ReturnType<typeof vi.fn>;
    connectMock.mockRejectedValue(new Error('Fatal Network Error'));

    await expect(manager.connect()).rejects.toThrow('Database connection failed after 3 attempts');
    expect(mockDriver.connect).toHaveBeenCalledTimes(3);
  });

  it('should gracefully disconnect', async () => {
    await manager.connect();
    await manager.disconnect();

    expect(mockDriver.disconnect).toHaveBeenCalledTimes(1);
    expect(() => manager.getDriver()).toThrow('Database is not connected');
  });

  it('should throw if getting driver before connection', () => {
    expect(() => manager.getDriver()).toThrow('Database is not connected');
  });
});
