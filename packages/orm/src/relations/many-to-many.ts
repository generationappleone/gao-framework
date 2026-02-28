/**
 * @gao/orm — ManyToMany Relation
 *
 * Represents a many-to-many relationship via a pivot/junction table.
 * Example: User belongsToMany Role via user_roles pivot table.
 *
 * Provides attach(), detach(), sync() for pivot management.
 */

import type { BaseModel } from '../model.js';
import type { DatabaseDriver } from '../drivers/driver.interface.js';
import { QueryBuilder } from '../query-builder.js';
import { getModelDriver } from '../active-record.js';
import { Relation } from './relation.js';

export class ManyToMany<TParent extends BaseModel = any, TRelated extends BaseModel = any> extends Relation<TParent, TRelated> {
    constructor(
        parent: TParent | null,
        relatedModel: new (...args: any[]) => TRelated,
        localKey: string,
        foreignKey: string,
        /** The pivot/junction table name (e.g., 'user_roles') */
        public pivotTable: string,
        /** Column on the pivot table referencing the parent model (e.g., 'user_id') */
        public pivotLocalKey: string,
        /** Column on the pivot table referencing the related model (e.g., 'role_id') */
        public pivotForeignKey: string,
        /** Extra columns to select from pivot table */
        private _withPivotColumns: string[] = [],
    ) {
        super(parent, relatedModel, localKey, foreignKey);
    }

    /** Specify extra pivot columns to select with results. */
    withPivot(...columns: string[]): this {
        this._withPivotColumns.push(...columns);
        return this;
    }

    addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void {
        const foreignTable = this.getRelatedTable();
        query
            .join(
                this.pivotTable,
                `${foreignTable}.${this.foreignKey}`,
                '=',
                `${this.pivotTable}.${this.pivotForeignKey}`,
            )
            .where(`${this.pivotTable}.${this.pivotLocalKey}`, '=', localValue);
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

        const foreignTable = this.getRelatedTable();
        const qb = this.newQuery();
        qb
            .select(`${foreignTable}.*`, `${this.pivotTable}.${this.pivotLocalKey} as __pivot_parent_key`)
            .join(
                this.pivotTable,
                `${foreignTable}.${this.foreignKey}`,
                '=',
                `${this.pivotTable}.${this.pivotForeignKey}`,
            )
            .whereIn(`${this.pivotTable}.${this.pivotLocalKey}`, uniqueValues);

        const rows = await qb.get();

        const map = new Map<unknown, TRelated[]>();
        for (const row of rows) {
            const parentKey = (row as Record<string, unknown>)['__pivot_parent_key'];
            if (!map.has(parentKey)) map.set(parentKey, []);
            map.get(parentKey)!.push(row as TRelated);
        }

        return map;
    }

    // ─── Pivot Persistence Methods ──────────────────────────────

    /**
     * Attach one or more related models to the parent via the pivot table.
     * @param ids Single ID or array of IDs to attach
     * @param pivotData Optional extra data for the pivot row
     */
    async attach(
        ids: string | string[],
        pivotData: Record<string, unknown> = {},
    ): Promise<void> {
        const parentValue = this.getParentKeyValue();
        const idArray = Array.isArray(ids) ? ids : [ids];
        const driver = getModelDriver();

        for (const id of idArray) {
            const pivotRow: Record<string, unknown> = {
                [this.pivotLocalKey]: parentValue,
                [this.pivotForeignKey]: id,
                ...pivotData,
            };
            const qb = new QueryBuilder(driver, this.resolveDialect(), this.pivotTable);
            await qb.insert(pivotRow);
        }
    }

    /**
     * Detach one or more related models from the parent via the pivot table.
     * If no IDs are provided, detach all.
     * @param ids Optional ID or array of IDs to detach
     */
    async detach(ids?: string | string[]): Promise<void> {
        const parentValue = this.getParentKeyValue();
        const driver = getModelDriver();
        const qb = new QueryBuilder(driver, this.resolveDialect(), this.pivotTable);
        qb.where(this.pivotLocalKey, '=', parentValue);

        if (ids !== undefined) {
            const idArray = Array.isArray(ids) ? ids : [ids];
            qb.whereIn(this.pivotForeignKey, idArray);
        }

        await qb.delete();
    }

    /**
     * Sync the pivot table to contain exactly the given IDs.
     * Detaches IDs not in the list, attaches IDs not yet present.
     * @param ids Array of IDs or map of ID -> pivot data
     * @returns Object with attached and detached arrays
     */
    async sync(
        ids: string[] | Record<string, Record<string, unknown>>,
    ): Promise<{ attached: string[]; detached: string[] }> {
        const parentValue = this.getParentKeyValue();
        const driver = getModelDriver();

        // Determine desired IDs and pivot data
        let desiredIds: string[];
        let pivotDataMap: Record<string, Record<string, unknown>> = {};
        if (Array.isArray(ids)) {
            desiredIds = ids;
        } else {
            desiredIds = Object.keys(ids);
            pivotDataMap = ids;
        }

        // Get current pivot records
        const currentQb = new QueryBuilder(driver, this.resolveDialect(), this.pivotTable);
        currentQb.where(this.pivotLocalKey, '=', parentValue);
        const currentRows = await currentQb.get() as Record<string, unknown>[];
        const currentIds = currentRows.map((r) => String(r[this.pivotForeignKey]));

        // Compute diff
        const toAttach = desiredIds.filter((id) => !currentIds.includes(id));
        const toDetach = currentIds.filter((id) => !desiredIds.includes(id));

        // Detach removed
        if (toDetach.length > 0) {
            await this.detach(toDetach);
        }

        // Attach new
        for (const id of toAttach) {
            await this.attach(id, pivotDataMap[id] ?? {});
        }

        return { attached: toAttach, detached: toDetach };
    }

    /**
     * Legacy compatibility — override query() to use the join-based approach.
     */
    override query(driver: DatabaseDriver, localValue: any): QueryBuilder<any> {
        const foreignTable = this.getRelatedTable();
        return new QueryBuilder<any>(driver, this.resolveDialect(), foreignTable)
            .join(
                this.pivotTable,
                `${foreignTable}.${this.foreignKey}`,
                '=',
                `${this.pivotTable}.${this.pivotForeignKey}`,
            )
            .where(`${this.pivotTable}.${this.pivotLocalKey}`, '=', localValue);
    }
}
