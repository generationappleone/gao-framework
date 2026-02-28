/**
 * @gao/orm — MorphMany Relation
 *
 * Represents a polymorphic one-to-many relationship.
 * Example: Post morphMany Comment (comments.commentable_type, comments.commentable_id)
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class MorphMany<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    constructor(
        parent: TParent | null,
        relatedModel: new (...args: any[]) => TRelated,
        /** The morph name prefix (e.g., 'commentable') */
        private morphName: string,
        /** PK of the parent model (default: 'id') */
        localKey: string = 'id',
    ) {
        super(parent, relatedModel, localKey, `${morphName}_id`);
    }

    private get morphTypeColumn(): string {
        return `${this.morphName}_type`;
    }

    private get morphIdColumn(): string {
        return `${this.morphName}_id`;
    }

    private getMorphType(): string {
        if (!this.parent) throw new Error('No parent model for morph type resolution');
        return this.getTableName(this.parent.constructor as any);
    }

    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        query
            .where(this.morphTypeColumn, '=', this.getMorphType())
            .where(this.morphIdColumn, '=', localValue);
    }

    async getResults(): Promise<TRelated[]> {
        const localValue = this.getParentKeyValue();
        const qb = this.newQuery();
        this.addConstraints(qb, localValue);
        const rows = await qb.get();
        return rows as TRelated[];
    }

    async getEager(parentModels: TParent[]): Promise<Map<unknown, TRelated[]>> {
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

        const map = new Map<unknown, TRelated[]>();
        for (const row of rows) {
            const key = (row as Record<string, unknown>)[this.morphIdColumn];
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(row as TRelated);
        }

        return map;
    }
}
