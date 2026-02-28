/**
 * @gao/orm — MorphToMany Relation
 *
 * Represents a polymorphic many-to-many relationship via a pivot table.
 * Example: Post morphToMany Tag via taggables (taggable_type, taggable_id, tag_id)
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { Relation } from './relation.js';

export class MorphToMany<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    constructor(
        parent: TParent | null,
        relatedModel: new (...args: any[]) => TRelated,
        /** The morph name prefix (e.g., 'taggable') */
        private morphName: string,
        /** The pivot/junction table name (e.g., 'taggables') */
        private pivotTable: string,
        /** FK on the related model (e.g., 'id') */
        foreignKey: string = 'id',
        /** PK of the parent model (e.g., 'id') */
        localKey: string = 'id',
        /** FK on the pivot for the related model (e.g., 'tag_id') */
        private pivotForeignKey: string = '',
    ) {
        super(parent, relatedModel, localKey, foreignKey);
        if (!this.pivotForeignKey) {
            // default: lowercase model name + '_id' (e.g., 'tag_id')
            this.pivotForeignKey = relatedModel.name.toLowerCase() + '_id';
        }
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
        const relatedTable = this.getRelatedTable();
        query
            .join(
                this.pivotTable,
                `${relatedTable}.${this.foreignKey}`,
                '=',
                `${this.pivotTable}.${this.pivotForeignKey}`,
            )
            .where(`${this.pivotTable}.${this.morphTypeColumn}`, '=', this.getMorphType())
            .where(`${this.pivotTable}.${this.morphIdColumn}`, '=', localValue);
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

        const relatedTable = this.getRelatedTable();
        const qb = this.newQuery();
        qb
            .select(`${relatedTable}.*`, `${this.pivotTable}.${this.morphIdColumn} as __morph_parent_key`)
            .join(
                this.pivotTable,
                `${relatedTable}.${this.foreignKey}`,
                '=',
                `${this.pivotTable}.${this.pivotForeignKey}`,
            )
            .where(`${this.pivotTable}.${this.morphTypeColumn}`, '=', morphType)
            .whereIn(`${this.pivotTable}.${this.morphIdColumn}`, uniqueValues);

        const rows = await qb.get();

        const map = new Map<unknown, TRelated[]>();
        for (const row of rows) {
            const parentKey = (row as Record<string, unknown>)['__morph_parent_key'];
            if (!map.has(parentKey)) map.set(parentKey, []);
            map.get(parentKey)!.push(row as TRelated);
        }

        return map;
    }
}
