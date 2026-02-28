/**
 * @gao/orm — MorphTo Relation
 *
 * Represents the inverse side of a polymorphic relationship.
 * Example: Comment morphTo commentable (reads commentable_type + commentable_id to resolve parent)
 *
 * Note: MorphTo requires a morph map to resolve type strings to model classes.
 */

import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { getModelDriver } from '../active-record.js';
import { getMetadata } from '../decorators.js';
import { Relation } from './relation.js';

/** Global morph map: table name -> model constructor */
const morphMap = new Map<string, new (...args: any[]) => any>();

/**
 * Register model classes in the global morph map.
 * This allows MorphTo to resolve type strings to constructors.
 *
 * @example
 * registerMorphMap({
 *   posts: Post,
 *   videos: Video,
 * });
 */
export function registerMorphMap(map: Record<string, new (...args: any[]) => any>): void {
    for (const [key, model] of Object.entries(map)) {
        morphMap.set(key, model);
    }
}

/**
 * Get a model class from the morph map by its type string.
 */
export function resolveMorphType(type: string): (new (...args: any[]) => any) | undefined {
    return morphMap.get(type);
}

export class MorphTo<TParent extends BaseModel = any> extends Relation<TParent, any> {
    constructor(
        parent: TParent | null,
        /** The morph name prefix (e.g., 'commentable') */
        private morphName: string,
    ) {
        // Dummy relatedModel — will be resolved at runtime from the type column
        super(parent, Object as any, '', '');
    }

    private get morphTypeColumn(): string {
        return `${this.morphName}_type`;
    }

    private get morphIdColumn(): string {
        return `${this.morphName}_id`;
    }

    addConstraints(_query: QueryBuilder<Record<string, unknown>>, _localValue: unknown): void {
        // MorphTo constraints are dynamic — resolved at getResults time
        // This method is a no-op; use getResults() instead.
    }

    async getResults(): Promise<any | null> {
        if (!this.parent) return null;

        const morphType = (this.parent as any)[this.morphTypeColumn] as string;
        const morphId = (this.parent as any)[this.morphIdColumn];

        if (!morphType || morphId == null) return null;

        const ModelClass = resolveMorphType(morphType);
        if (!ModelClass) {
            throw new Error(
                `MorphTo: No model registered for type "${morphType}". ` +
                `Use registerMorphMap() to register: registerMorphMap({ '${morphType}': YourModel })`,
            );
        }

        const tableName = getMetadata(ModelClass).tableName || ModelClass.name.toLowerCase() + 's';
        const driver = getModelDriver();
        const qb = new QueryBuilder(driver, this.resolveDialect(), tableName);
        qb.where('id', '=', morphId).limit(1);
        const rows = await qb.get();
        return rows[0] ?? null;
    }

    async getEager(parentModels: TParent[]): Promise<Map<string, any>> {
        // Group parents by morph type
        const groups = new Map<string, { ids: unknown[]; parents: TParent[] }>();

        for (const model of parentModels) {
            const type = (model as any)[this.morphTypeColumn] as string;
            const id = (model as any)[this.morphIdColumn];
            if (!type || id == null) continue;

            if (!groups.has(type)) groups.set(type, { ids: [], parents: [] });
            const group = groups.get(type)!;
            group.ids.push(id);
            group.parents.push(model);
        }

        // Query each morph type group
        const results = new Map<string, any>();
        const driver = getModelDriver();

        for (const [type, { ids }] of groups) {
            const ModelClass = resolveMorphType(type);
            if (!ModelClass) continue;

            const tableName = getMetadata(ModelClass).tableName || ModelClass.name.toLowerCase() + 's';
            const uniqueIds = [...new Set(ids)];
            const qb = new QueryBuilder(driver, this.resolveDialect(), tableName);
            qb.whereIn('id', uniqueIds);
            const rows = await qb.get();

            // Index by ID
            for (const row of rows) {
                const rowId = (row as Record<string, unknown>)['id'];
                // Composite key: type + id
                results.set(`${type}:${rowId}`, row);
            }
        }

        return results;
    }
}
