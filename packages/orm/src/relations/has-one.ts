/**
 * @gao/orm — HasOne Relation
 *
 * Represents a one-to-one relationship where the foreign key resides on the related model.
 * Example: User hasOne Profile (profiles.user_id -> users.id)
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class HasOne<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        query.where(this.foreignKey, '=', localValue).limit(1);
    }

    async getResults(): Promise<TRelated | null> {
        const localValue = this.getParentKeyValue();
        const qb = this.newQuery();
        this.addConstraints(qb, localValue);
        const rows = await qb.get();
        return (rows[0] as TRelated) ?? null;
    }

    async getEager(parentModels: TParent[]): Promise<Map<unknown, TRelated | null>> {
        const localValues = parentModels.map((m) => (m as any)[this.localKey]);
        const uniqueValues = [...new Set(localValues)];

        if (uniqueValues.length === 0) return new Map();

        const qb = this.newQuery();
        qb.whereIn(this.foreignKey, uniqueValues);
        const rows = await qb.get();

        const map = new Map<unknown, TRelated | null>();
        for (const row of rows) {
            const key = (row as Record<string, unknown>)[this.foreignKey];
            if (!map.has(key)) {
                map.set(key, row as TRelated);
            }
        }

        return map;
    }
}
