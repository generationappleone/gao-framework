/**
 * @gao/orm — BelongsTo Relation
 *
 * Represents an inverse one-to-one or one-to-many relationship.
 * The foreign key resides on the current (child) model.
 * Example: Post belongsTo User (posts.user_id -> users.id)
 *
 * Note: In BelongsTo, localKey refers to the PK of the foreign/parent model,
 * and foreignKey refers to the FK column on the current/child model.
 * The parent value used for lookup is the child's foreignKey value.
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class BelongsTo<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        // localKey is the PK of the related model (e.g., 'id' on users)
        query.where(this.localKey, '=', localValue).limit(1);
    }

    async getResults(): Promise<TRelated | null> {
        // For BelongsTo, read the FK value from the child/parent model
        const foreignValue = (this.parent as any)[this.foreignKey];
        if (foreignValue === null || foreignValue === undefined) return null;

        const qb = this.newQuery();
        // Query by the related model's PK
        qb.where(this.localKey, '=', foreignValue).limit(1);
        const rows = await qb.get();
        return (rows[0] as TRelated) ?? null;
    }

    async getEager(parentModels: TParent[]): Promise<Map<unknown, TRelated | null>> {
        // Collect FK values from child models
        const foreignValues = parentModels.map((m) => (m as any)[this.foreignKey]);
        const uniqueValues = [...new Set(foreignValues.filter((v) => v != null))];

        if (uniqueValues.length === 0) return new Map();

        const qb = this.newQuery();
        qb.whereIn(this.localKey, uniqueValues);
        const rows = await qb.get();

        // Map by PK of related model
        const pkMap = new Map<unknown, TRelated>();
        for (const row of rows) {
            const key = (row as Record<string, unknown>)[this.localKey];
            pkMap.set(key, row as TRelated);
        }

        // Build result map keyed by child's FK value
        const map = new Map<unknown, TRelated | null>();
        for (const fk of uniqueValues) {
            map.set(fk, pkMap.get(fk) ?? null);
        }

        return map;
    }

    /**
     * Associate this child model with a parent model.
     * Sets the foreign key value on the child (parent of this relation).
     * Does NOT persist — you must call save() on the model after.
     * @param related The parent model instance or its ID
     */
    associate(related: TRelated | string): void {
        if (!this.parent) {
            throw new Error('BelongsTo.associate: No parent model instance.');
        }
        const id = typeof related === 'string' ? related : (related as any)[this.localKey];
        (this.parent as any)[this.foreignKey] = id;
    }

    /**
     * Dissociate the child from its parent.
     * Sets the foreign key to null on the child model.
     * Does NOT persist — you must call save() on the model after.
     */
    dissociate(): void {
        if (!this.parent) {
            throw new Error('BelongsTo.dissociate: No parent model instance.');
        }
        (this.parent as any)[this.foreignKey] = null;
    }
}
