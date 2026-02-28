/**
 * @gao/orm — MorphOne Relation
 *
 * Represents a polymorphic one-to-one relationship.
 * Example: Post morphOne Image (images.imageable_type, images.imageable_id)
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class MorphOne<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    constructor(
        parent: TParent | null,
        relatedModel: new (...args: any[]) => TRelated,
        /** The morph name prefix (e.g., 'imageable' -> imageable_type + imageable_id) */
        private morphName: string,
        /** PK of the parent model (default: 'id') */
        localKey: string = 'id',
    ) {
        // foreignKey is the morph id column (e.g., 'imageable_id')
        super(parent, relatedModel, localKey, `${morphName}_id`);
    }

    /** The type column on the related table (e.g., 'imageable_type') */
    private get morphTypeColumn(): string {
        return `${this.morphName}_type`;
    }

    /** The ID column on the related table (e.g., 'imageable_id') */
    private get morphIdColumn(): string {
        return `${this.morphName}_id`;
    }

    /** Get the morph type value for the parent model */
    private getMorphType(): string {
        if (!this.parent) throw new Error('No parent model for morph type resolution');
        return this.getTableName(this.parent.constructor as any);
    }

    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        query
            .where(this.morphTypeColumn, '=', this.getMorphType())
            .where(this.morphIdColumn, '=', localValue)
            .limit(1);
    }

    async getResults(): Promise<TRelated | null> {
        const localValue = this.getParentKeyValue();
        const qb = this.newQuery();
        this.addConstraints(qb, localValue);
        const rows = await qb.get();
        return (rows[0] as TRelated) ?? null;
    }

    async getEager(parentModels: TParent[]): Promise<Map<unknown, TRelated | null>> {
        if (parentModels.length === 0) return new Map();

        const morphType = this.getTableName(parentModels[0]!.constructor as any);
        const localValues = parentModels.map((m) => (m as any)[this.localKey]);
        const uniqueValues = [...new Set(localValues)];

        if (uniqueValues.length === 0) return new Map();

        const qb = this.newQuery();
        qb
            .where(this.morphTypeColumn, '=', morphType)
            .whereIn(this.morphIdColumn, uniqueValues);

        const rows = await qb.get();

        const map = new Map<unknown, TRelated | null>();
        for (const row of rows) {
            const key = (row as Record<string, unknown>)[this.morphIdColumn];
            if (!map.has(key)) {
                map.set(key, row as TRelated);
            }
        }

        return map;
    }
}
