import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { QueryBuilder } from '../src/query-builder.js';

describe('Pagination Helper', () => {
  let mockDriver: DatabaseDriver;

  beforeEach(() => {
    mockDriver = {
      query: vi.fn(),
      execute: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      transaction: vi.fn(),
    } as unknown as DatabaseDriver;
  });

  it('should query for count and retrieve a paginated result', async () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    const mockQuery = mockDriver.query as unknown as ReturnType<typeof vi.fn>;

    // Mock the COUNT query
    mockQuery.mockResolvedValueOnce([{ total: 35 }]);

    // Mock the main query
    mockQuery.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const result = await qb.where('status', 'active').paginate(2, 10);

    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);

    expect(result.meta).toEqual({
      page: 2,
      perPage: 10,
      total: 35,
      totalPages: 4,
      hasPrev: true,
      hasNext: true,
    });

    const calls = mockQuery.mock.calls;

    // Count query check
    expect(calls[0][0]).toContain('SELECT COUNT(*) as total FROM "users" WHERE "status" = $1');

    // Main data query check
    expect(calls[1][0]).toContain('SELECT * FROM "users" WHERE "status" = $1 LIMIT 10 OFFSET 10');
  });

  it('should handle empty result sets', async () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    const mockQuery = mockDriver.query as unknown as ReturnType<typeof vi.fn>;

    mockQuery.mockResolvedValueOnce([{ total: 0 }]); // Count
    mockQuery.mockResolvedValueOnce([]); // Results

    const result = await qb.paginate(1, 15);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
    expect(result.meta.hasPrev).toBe(false);
    expect(result.meta.hasNext).toBe(false);
  });
});
