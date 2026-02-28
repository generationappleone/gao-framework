/**
 * @gao/orm — Base Relation
 *
 * Abstract base class for all relation types.
 * Provides shared utilities: table name resolution, dialect resolution, query building.
 * Also provides query-builder delegation so relations can be chained like queries:
 *   await user.posts().where('status', 'published').orderBy('created_at', 'DESC').get()
 */

import { getMetadata } from '../decorators.js';
import type { DatabaseDriver } from '../drivers/driver.interface.js';
import type { BaseModel } from '../model.js';
import { QueryBuilder } from '../query-builder.js';
import { getModelDialect, getModelDriver } from '../active-record.js';

export type Dialect = 'postgres' | 'sqlite' | 'mysql' | 'mariadb';

/**
 * Base relation class.
 *
 * All concrete relations (HasOne, HasMany, BelongsTo, ManyToMany, etc.)
 * extend this class and implement `getResults()` and `getEager()`.
 */
export abstract class Relation<TParent extends BaseModel = any, TRelated extends BaseModel = any> {
    /** Internal query builder for chainable constraints */
    protected _query: QueryBuilder<Record<string, unknown>> | null = null;

    constructor(
        /** The parent model instance that owns this relation */
        protected parent: TParent | null,
        /** Constructor of the related model class */
        protected relatedModel: new (...args: any[]) => TRelated,
        /** Column on the local/parent side */
        public localKey: string,
        /** Column on the foreign/related side */
        public foreignKey: string,
    ) { }

    /** Resolve the table name for a model using its decorator metadata. */
    protected getTableName(model: new (...args: any[]) => any): string {
        return getMetadata(model).tableName || model.name.toLowerCase() + 's';
    }

    /** Get the related model's table name. */
    protected getRelatedTable(): string {
        return this.getTableName(this.relatedModel);
    }

    /** Resolve the current dialect from the global model configuration. */
    protected resolveDialect(): Dialect {
        return getModelDialect();
    }

    /** Create a fresh QueryBuilder scoped to the related model's table. */
    protected newQuery(): QueryBuilder<Record<string, unknown>> {
        return new QueryBuilder<Record<string, unknown>>(
            getModelDriver(),
            this.resolveDialect(),
            this.getRelatedTable(),
        );
    }

    /** Get the value of the local key from the parent model. */
    protected getParentKeyValue(): unknown {
        if (!this.parent) {
            throw new Error('Relation has no parent model instance. Cannot resolve key value.');
        }
        return (this.parent as any)[this.localKey];
    }

    /**
     * Get or create the constrained query builder for this relation.
     * The first call creates the QB and applies relation constraints.
     */
    protected getConstrainedQuery(): QueryBuilder<Record<string, unknown>> {
        if (!this._query) {
            this._query = this.newQuery();
            const localValue = this.getParentKeyValue();
            this.addConstraints(this._query, localValue);
        }
        return this._query;
    }

    /**
     * Execute the relation query and return results.
     * For HasOne/BelongsTo: returns a single model or null.
     * For HasMany/ManyToMany: returns an array of models.
     */
    abstract getResults(): Promise<TRelated | TRelated[] | null>;

    /**
     * Get eager-loaded results for a batch of parent models.
     * Returns a Map keyed by the parent's local key value.
     */
    abstract getEager(parentModels: TParent[]): Promise<Map<unknown, any>>;

    /**
     * Add constraints to the base query for a specific parent value.
     * Used when building the relation query for a single parent.
     */
    abstract addConstraints(query: QueryBuilder<Record<string, unknown>>, localValue: unknown): void;

    /**
     * Legacy compatibility — returns a QueryBuilder for the given local value.
     * Used by old code paths and the existing eager loading system.
     */
    query(_driver: DatabaseDriver, localValue: any): QueryBuilder<any> {
        const qb = this.newQuery();
        this.addConstraints(qb, localValue);
        return qb as QueryBuilder<any>;
    }

    // ─── Query Builder Delegation (Chainable) ─────────────────────

    /** Add a WHERE clause. */
    where(column: string, operatorOrValue: any, value?: any): this {
        const qb = this.getConstrainedQuery();
        if (value === undefined) {
            qb.where(column, operatorOrValue);
        } else {
            qb.where(column, operatorOrValue, value);
        }
        return this;
    }

    /** Add an OR WHERE clause. */
    orWhere(column: string, operatorOrValue: any, value?: any): this {
        const qb = this.getConstrainedQuery();
        if (value === undefined) {
            qb.orWhere(column, operatorOrValue);
        } else {
            qb.orWhere(column, operatorOrValue, value);
        }
        return this;
    }

    /** Add a WHERE IN clause. */
    whereIn(column: string, values: unknown[]): this {
        this.getConstrainedQuery().whereIn(column, values);
        return this;
    }

    /** Add a WHERE NOT IN clause. */
    whereNotIn(column: string, values: unknown[]): this {
        this.getConstrainedQuery().whereNotIn(column, values);
        return this;
    }

    /** Add a WHERE NULL clause. */
    whereNull(column: string): this {
        this.getConstrainedQuery().whereNull(column);
        return this;
    }

    /** Add a WHERE NOT NULL clause. */
    whereNotNull(column: string): this {
        this.getConstrainedQuery().whereNotNull(column);
        return this;
    }

    /** Add an ORDER BY clause. */
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.getConstrainedQuery().orderBy(column, direction);
        return this;
    }

    /** Set a LIMIT. */
    limit(limit: number): this {
        this.getConstrainedQuery().limit(limit);
        return this;
    }

    /** Set an OFFSET. */
    offset(offset: number): this {
        this.getConstrainedQuery().offset(offset);
        return this;
    }

    /** Select specific columns. */
    select(...columns: string[]): this {
        this.getConstrainedQuery().select(...columns);
        return this;
    }

    // ─── Query Execution (Terminal Methods) ───────────────────────

    /** Execute the constrained query and return all matching rows. */
    async get(): Promise<TRelated[]> {
        const rows = await this.getConstrainedQuery().get();
        return rows as TRelated[];
    }

    /** Get the first matching result. */
    async first(): Promise<TRelated | null> {
        this.getConstrainedQuery().limit(1);
        const rows = await this.getConstrainedQuery().get();
        return (rows[0] as TRelated) ?? null;
    }

    /** Count matching records. */
    async count(column = '*'): Promise<number> {
        return this.getConstrainedQuery().count(column);
    }

    /** Check if any matching records exist. */
    async exists(): Promise<boolean> {
        return this.getConstrainedQuery().exists();
    }

    /** Get single column values. */
    async pluck<V = unknown>(column: string): Promise<V[]> {
        return this.getConstrainedQuery().pluck<V>(column);
    }
}

