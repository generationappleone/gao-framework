/**
 * @gao/orm — Database Seeder
 *
 * Base classes and runners for populating the database with initial/dummy data.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';

export interface Seeder {
  /** Unique name for the seeder, typically the class name */
  name: string;

  /** Names of seeders that must run before this one */
  dependencies?: string[];

  /** The seeding logic */
  run(driver: DatabaseDriver): Promise<void>;
}

export class SeederRunner {
  constructor(private driver: DatabaseDriver) {}

  /**
   * Executes an array of seeders, automatically resolving dependencies and ensuring correct order.
   */
  async run(seeders: Seeder[]): Promise<string[]> {
    const sorted = this.topologicalSort(seeders);
    const executed: string[] = [];

    for (const seeder of sorted) {
      // Wait, we just run them one by one in sorted order
      await seeder.run(this.driver);
      executed.push(seeder.name);
    }

    return executed;
  }

  private topologicalSort(seeders: Seeder[]): Seeder[] {
    const sorted: Seeder[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const seederMap = new Map<string, Seeder>();
    for (const s of seeders) {
      seederMap.set(s.name, s);
    }

    const visit = (seederName: string) => {
      if (visited.has(seederName)) return;
      if (visiting.has(seederName)) {
        throw new Error(`Circular dependency detected involving seeder: ${seederName}`);
      }

      const seeder = seederMap.get(seederName);
      if (!seeder) {
        throw new Error(`Missing dependency seeder: ${seederName}`);
      }

      visiting.add(seederName);

      if (seeder.dependencies) {
        for (const dep of seeder.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(seederName);
      visited.add(seederName);
      sorted.push(seeder);
    };

    for (const seeder of seeders) {
      visit(seeder.name);
    }

    return sorted;
  }
}
