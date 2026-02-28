/**
 * @gao/orm — HasOneThrough Relation
 *
 * Represents a has-one-through (indirect one-to-one) relationship.
 * Example: Supplier hasOneThrough AccountHistory via User
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class HasOneThrough<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    constructor(
        parent: TParent | null,
        relatedModel: new (...args: any[]) => TRelated,
        /** The intermediate model class */
        private throughModel: new (...args: any[]) => any,
        /** FK on the through model pointing to the parent */
        private firstKey: string,
        /** FK on the related model pointing to the through model */
        private secondKey: string,
        /** PK of the parent model */
        localKey: string,
        /** PK of the through model */
        private secondLocalKey: string,
    ) {
        super(parent, relatedModel, localKey, '');
    }

    private getThroughTable(): string {
        return this.getTableName(this.throughModel);
    }

    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        const throughTable = this.getThroughTable();
        const relatedTable = this.getRelatedTable();
        query
            .join(
                throughTable,
                `${throughTable}.${this.secondLocalKey}`,
                '=',
                `${relatedTable}.${this.secondKey}`,
            )
            .where(`${throughTable}.${this.firstKey}`, '=', localValue)
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
        const localValues = parentModels.map((m) => (m as any)[this.localKey]);
        const uniqueValues = [...new Set(localValues)];

        if (uniqueValues.length === 0) return new Map();

        const throughTable = this.getThroughTable();
        const relatedTable = this.getRelatedTable();
        const qb = this.newQuery();
        qb
            .select(`${relatedTable}.*`, `${throughTable}.${this.firstKey} as __through_parent_key`)
            .join(
                throughTable,
                `${throughTable}.${this.secondLocalKey}`,
                '=',
                `${relatedTable}.${this.secondKey}`,
            )
            .whereIn(`${throughTable}.${this.firstKey}`, uniqueValues);

        const rows = await qb.get();

        const map = new Map<unknown, TRelated | null>();
        for (const row of rows) {
            const parentKey = (row as Record<string, unknown>)['__through_parent_key'];
            if (!map.has(parentKey)) {
                map.set(parentKey, row as TRelated);
            }
        }

        return map;
    }
}
