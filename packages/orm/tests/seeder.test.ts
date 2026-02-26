import { describe, expect, it, vi } from 'vitest';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { type Seeder, SeederRunner } from '../src/seeder.js';

describe('Seeder Runner', () => {
  const mockDriver = {
    query: vi.fn(),
    execute: vi.fn(),
  } as unknown as DatabaseDriver;

  it('should execute seeders in standard order if no dependencies', async () => {
    const runner = new SeederRunner(mockDriver);

    const s1: Seeder = { name: 'A', run: vi.fn() };
    const s2: Seeder = { name: 'B', run: vi.fn() };

    const executed = await runner.run([s1, s2]);

    expect(executed).toEqual(['A', 'B']);
    expect(s1.run).toHaveBeenCalled();
    expect(s2.run).toHaveBeenCalled();
  });

  it('should correctly sort based on dependencies', async () => {
    const runner = new SeederRunner(mockDriver);

    // A depends on C, B depends on A
    // Correct order: C -> A -> B
    const A: Seeder = { name: 'A', dependencies: ['C'], run: vi.fn() };
    const B: Seeder = { name: 'B', dependencies: ['A'], run: vi.fn() };
    const C: Seeder = { name: 'C', run: vi.fn() };

    const executed = await runner.run([A, B, C]); // Pass in scrambled order
    expect(executed).toEqual(['C', 'A', 'B']);
  });

  it('should throw on circular dependencies', async () => {
    const runner = new SeederRunner(mockDriver);

    const A: Seeder = { name: 'A', dependencies: ['B'], run: vi.fn() };
    const B: Seeder = { name: 'B', dependencies: ['C'], run: vi.fn() };
    const C: Seeder = { name: 'C', dependencies: ['A'], run: vi.fn() };

    await expect(runner.run([A, B, C])).rejects.toThrow(/Circular dependency detected/);
  });

  it('should throw on missing dependencies', async () => {
    const runner = new SeederRunner(mockDriver);
    const A: Seeder = { name: 'A', dependencies: ['XYZ'], run: vi.fn() };

    await expect(runner.run([A])).rejects.toThrow(/Missing dependency seeder/);
  });
});
