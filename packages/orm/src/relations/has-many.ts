/**
 * @gao/orm — HasMany Relation
 *
 * Represents a one-to-many relationship.
 * Example: User hasMany Post (posts.user_id -> users.id)
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class HasMany<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        query.where(this.foreignKey, '=', localValue);
    }

    async getResults(): Promise<TRelated[]> {
        const localValue = this.getParentKeyValue();
        const qb = this.newQuery();
        this.addConstraints(qb, localValue);
        const rows = await qb.get();
        return rows as TRelated[];
    }

    async getEager(parentModels: TParent[]): Promise<Map<unknown, TRelated[]>> {
        const localValues = parentModels.map((m) => (m as any)[this.localKey]);
        const uniqueValues = [...new Set(localValues)];

        if (uniqueValues.length === 0) return new Map();

        const qb = this.newQuery();
        qb.whereIn(this.foreignKey, uniqueValues);
        const rows = await qb.get();

        const map = new Map<unknown, TRelated[]>();
        for (const row of rows) {
            const key = (row as Record<string, unknown>)[this.foreignKey];
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(row as TRelated);
        }

        return map;
    }

    /**
     * Create a new related model through this relation.
     * Automatically sets the foreign key to the parent's primary key value.
     * @param data Attributes for the new related model
     */
    async create(data: Record<string, unknown>): Promise<void> {
        const parentValue = this.getParentKeyValue();
        const insertData = { ...data, [this.foreignKey]: parentValue };
        const qb = this.newQuery();
        await qb.insert(insertData);
    }

    /**
     * Save an existing related model through this relation.
     * Sets the foreign key on the model attributes and persists via INSERT.
     * @param model The related model instance to save
     */
    async save(model: TRelated): Promise<void> {
        const parentValue = this.getParentKeyValue();
        (model as any)[this.foreignKey] = parentValue;
        const qb = this.newQuery();
        const attrs = (model as any).getAttributes
            ? (model as any).getAttributes()
            : { ...model };
        attrs[this.foreignKey] = parentValue;
        await qb.insert(attrs);
    }
}
