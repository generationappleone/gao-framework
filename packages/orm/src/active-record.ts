/**
 * @gao/orm — Active Record
 *
 * Provides static finders, instance persistence, and eager loading.
 * Extends BaseModel to create a full Active Record pattern.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';
import { getMetadata } from './decorators.js';
import { executeHooks } from './hooks.js';
import { QueryBuilder } from './query-builder.js';
import type { Relation } from './relations.js';
import type { PaginatedResult } from './pagination.js';

/** Global driver reference shared by all models */
let globalDriver: DatabaseDriver | null = null;
let globalDialect: 'postgres' | 'sqlite' | 'mysql' | 'mariadb' = 'postgres';

/**
 * Set the global database driver for all Active Record models.
 * Should be called once during app bootstrap.
 */
export function setModelDriver(
    driver: DatabaseDriver,
    dialect: 'postgres' | 'sqlite' | 'mysql' | 'mariadb' = 'postgres',
): void {
    globalDriver = driver;
    globalDialect = dialect;
}

/**
 * Get the global driver. Throws if not initialized.
 */
export function getModelDriver(): DatabaseDriver {
    if (!globalDriver) {
        throw new Error(
            'Model driver not initialized. Call setModelDriver(driver) during app bootstrap.',
        );
    }
    return globalDriver;
}

export function getModelDialect(): 'postgres' | 'sqlite' | 'mysql' | 'mariadb' {
    return globalDialect;
}

/**
 * Model — Active Record base class.
 *
 * Usage:
 * ```ts
 * @Table('contacts')
 * class Contact extends Model {
 *   @Column() name!: string;
 *   @Column() email!: string;
 * }
 *
 * const contact = await Contact.find('uuid-here');
 * contact.name = 'Updated';
 * await contact.save();
 * ```
 */
export class Model {
    /** Primary Key (UUID v4 by default) */
    public id!: string;
    public created_at?: string;
    public updated_at?: string;
    public deleted_at?: string;

    /** Tracks whether this is a new (unsaved) record */
    private _isNew = true;

    /** Store original values for dirty tracking */
    private _originalAttributes: Record<string, unknown> = {};

    /** Eagerly loaded relations */
    private _relations: Record<string, unknown> = {};

    // ─── Static: Connection ──────────────────────────────────────

    static get driver(): DatabaseDriver {
        return getModelDriver();
    }

    static get dialect(): 'postgres' | 'sqlite' | 'mysql' | 'mariadb' {
        return getModelDialect();
    }

    static get tableName(): string {
        return getMetadata(this).tableName;
    }

    // ─── Static: Query Builder ───────────────────────────────────

    /**
     * Returns a typed QueryBuilder for this model's table.
     */
    static query<T extends Model>(this: new (...args: any[]) => T): QueryBuilder<T> {
        const meta = getMetadata(this);
        return new QueryBuilder<T>((this as any).driver, (this as any).dialect, meta.tableName);
    }

    // ─── Static: Finders ─────────────────────────────────────────

    /**
     * Find a model by its primary key.
     */
    static async find<T extends Model>(
        this: new (...args: any[]) => T,
        id: string,
    ): Promise<T | null> {
        const meta = getMetadata(this);
        const driver = getModelDriver();
        const qb = new QueryBuilder(driver, getModelDialect(), meta.tableName);
        const rows = await qb.where('id', id).limit(1).get();
        if (rows.length === 0) return null;
        return (this as any).hydrate(rows[0] as Record<string, unknown>);
    }

    /**
     * Find a model or throw NotFoundError.
     */
    static async findOrFail<T extends Model>(
        this: new (...args: any[]) => T,
        id: string,
    ): Promise<T> {
        const result = await (this as any).find(id);
        if (!result) {
            throw new Error(`${this.name} with id '${id}' not found`);
        }
        return result as T;
    }

    /**
     * Get all records (respects soft delete — excludes deleted by default).
     */
    static async all<T extends Model>(this: new (...args: any[]) => T): Promise<T[]> {
        const meta = getMetadata(this);
        const driver = getModelDriver();
        const qb = new QueryBuilder(driver, getModelDialect(), meta.tableName);
        qb.whereNull('deleted_at');
        const rows = await qb.get();
        return rows.map((row) => (this as any).hydrate(row as Record<string, unknown>));
    }

    /**
     * Start a WHERE chain.
     */
    static where<T extends Model>(
        this: new (...args: any[]) => T,
        column: string,
        operatorOrValue?: any,
        value?: any,
    ): ModelQueryBuilder<T> {
        const meta = getMetadata(this);
        const driver = getModelDriver();
        const qb = new QueryBuilder<Record<string, unknown>>(driver, getModelDialect(), meta.tableName);

        if (value === undefined && operatorOrValue !== undefined) {
            qb.where(column, operatorOrValue);
        } else if (operatorOrValue !== undefined) {
            qb.where(column, operatorOrValue, value);
        }

        return new ModelQueryBuilder<T>(qb, this as any);
    }

    /**
     * Create a new model, save it to the database, and return it.
     */
    static async create<T extends Model>(
        this: new (...args: any[]) => T,
        data: Record<string, unknown>,
    ): Promise<T> {
        const instance = new this() as T;
        instance.fill(data);
        await instance.save();
        return instance;
    }

    /**
     * Find by match criteria or create a new record.
     */
    static async updateOrCreate<T extends Model>(
        this: new (...args: any[]) => T,
        match: Record<string, unknown>,
        data: Record<string, unknown>,
    ): Promise<T> {
        const meta = getMetadata(this);
        const driver = getModelDriver();
        const qb = new QueryBuilder(driver, getModelDialect(), meta.tableName);

        for (const [key, val] of Object.entries(match)) {
            qb.where(key, val);
        }

        const rows = await qb.limit(1).get();

        if (rows.length > 0) {
            const instance = (this as any).hydrate(rows[0] as Record<string, unknown>) as T;
            instance.fill(data);
            await instance.save();
            return instance;
        }

        return (this as any).create({ ...match, ...data }) as Promise<T>;
    }

    // ─── Static: Eager Loading ───────────────────────────────────

    /**
     * Start a query with eager loading.
     */
    static with<T extends Model>(
        this: new (...args: any[]) => T,
        ...relations: string[]
    ): ModelQueryBuilder<T> {
        const meta = getMetadata(this);
        const driver = getModelDriver();
        const qb = new QueryBuilder<Record<string, unknown>>(driver, getModelDialect(), meta.tableName);
        const mqb = new ModelQueryBuilder<T>(qb, this as any);
        mqb.eagerLoad(...relations);
        return mqb;
    }

    // ─── Static: Hydration ───────────────────────────────────────

    /**
     * Create a model instance from a raw database row.
     */
    static hydrate<T extends Model>(
        this: new (...args: any[]) => T,
        row: Record<string, unknown>,
    ): T {
        const instance = Object.create(this.prototype) as T;
        // Assign all row values to instance
        for (const [key, value] of Object.entries(row)) {
            (instance as any)[key] = value;
        }
        instance._isNew = false;
        instance._originalAttributes = { ...row };
        instance._relations = {};
        return instance;
    }

    // ─── Instance: Persistence ───────────────────────────────────

    /**
     * Fill model with data.
     */
    public fill(data: Record<string, unknown>): this {
        for (const [key, value] of Object.entries(data)) {
            if (key !== '_isNew' && key !== '_originalAttributes' && key !== '_relations') {
                (this as any)[key] = value;
            }
        }
        return this;
    }

    /**
     * Save the model — INSERT if new, UPDATE dirty fields if existing.
     */
    public async save(): Promise<this> {
        const meta = getMetadata(this.constructor);
        const driver = getModelDriver();
        const dialect = getModelDialect();
        const tableName = meta.tableName;

        // Run BeforeSave hooks
        await executeHooks(this, 'beforeSave');

        if (this._isNew) {
            // INSERT
            if (!this.id) {
                const { randomUUID } = await import('node:crypto');
                this.id = randomUUID();
            }
            this.created_at = this.created_at || new Date().toISOString();
            this.updated_at = new Date().toISOString();

            const attributes = this.getAttributes();
            const qb = new QueryBuilder(driver, dialect, tableName);
            await qb.insert(attributes);

            this._isNew = false;
        } else {
            // UPDATE — only dirty fields
            const dirty = this.getDirty();
            if (Object.keys(dirty).length === 0) return this;

            dirty.updated_at = new Date().toISOString();
            this.updated_at = dirty.updated_at as string;

            const qb = new QueryBuilder(driver, dialect, tableName);
            await qb.where('id', this.id).update(dirty);
        }

        this.syncOriginal();

        // Run AfterSave hooks
        await executeHooks(this, 'afterSave');

        return this;
    }

    /**
     * Destroy the model — soft delete by default, hard delete with force: true.
     */
    public async destroy(options?: { force?: boolean }): Promise<void> {
        const meta = getMetadata(this.constructor);
        const driver = getModelDriver();
        const dialect = getModelDialect();
        const tableName = meta.tableName;

        // Run BeforeDelete hooks
        await executeHooks(this, 'beforeDelete');

        const qb = new QueryBuilder(driver, dialect, tableName);

        if (options?.force) {
            // Hard delete
            await qb.where('id', this.id).delete();
        } else {
            // Soft delete
            this.deleted_at = new Date().toISOString();
            await qb.where('id', this.id).update({ deleted_at: this.deleted_at });
        }

        // Run AfterDelete hooks
        await executeHooks(this, 'afterDelete');
    }

    /**
     * Refresh the model from the database.
     */
    public async refresh(): Promise<this> {
        const meta = getMetadata(this.constructor);
        const driver = getModelDriver();
        const dialect = getModelDialect();
        const tableName = meta.tableName;

        const qb = new QueryBuilder(driver, dialect, tableName);
        const rows = await qb.where('id', this.id).limit(1).get();

        if (rows.length === 0) {
            throw new Error(`Model ${this.constructor.name} with id '${this.id}' no longer exists`);
        }

        const row = rows[0] as Record<string, unknown>;
        for (const [key, value] of Object.entries(row)) {
            (this as any)[key] = value;
        }
        this.syncOriginal();
        return this;
    }

    // ─── Instance: Attribute Tracking ────────────────────────────

    public getAttributes(): Record<string, unknown> {
        const attributes: Record<string, unknown> = {};
        for (const key of Object.keys(this)) {
            if (key.startsWith('_') || typeof (this as any)[key] === 'function') continue;
            attributes[key] = (this as any)[key];
        }
        return attributes;
    }

    public syncOriginal(): this {
        this._originalAttributes = { ...this.getAttributes() };
        return this;
    }

    public isDirty(attribute?: string): boolean {
        const dirty = this.getDirty();
        if (attribute) return Object.prototype.hasOwnProperty.call(dirty, attribute);
        return Object.keys(dirty).length > 0;
    }

    public getDirty(): Record<string, unknown> {
        const current = this.getAttributes();
        const dirty: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(current)) {
            if (this._originalAttributes[key] !== value) {
                dirty[key] = value;
            }
        }
        return dirty;
    }

    // ─── Instance: Serialization ─────────────────────────────────

    public toJSON(): Record<string, unknown> {
        const attrs = this.getAttributes();
        // Include eagerly loaded relations
        for (const [key, value] of Object.entries(this._relations)) {
            attrs[key] = value;
        }
        return attrs;
    }

    // ─── Instance: Relation Access ───────────────────────────────

    /**
     * Get eagerly loaded relation data.
     */
    public getRelation(name: string): unknown {
        return this._relations[name];
    }

    /**
     * Set relation data (used by eager loader).
     */
    public setRelation(name: string, value: unknown): void {
        this._relations[name] = value;
    }
}

// ─── ModelQueryBuilder ─────────────────────────────────────────

/**
 * A typed wrapper around QueryBuilder that returns hydrated Model instances.
 */
export class ModelQueryBuilder<T extends Model> {
    private _eagerLoads: string[] = [];

    constructor(
        private qb: QueryBuilder<Record<string, unknown>>,
        private ModelClass: new (...args: any[]) => T,
    ) { }

    // ─── Chainable WHERE methods ─────────────────────────────────

    where(column: string, operatorOrValue: any, value?: any): this {
        if (value === undefined) {
            this.qb.where(column, operatorOrValue);
        } else {
            this.qb.where(column, operatorOrValue, value);
        }
        return this;
    }

    orWhere(column: string, operatorOrValue: any, value?: any): this {
        if (value === undefined) {
            this.qb.orWhere(column, operatorOrValue);
        } else {
            this.qb.orWhere(column, operatorOrValue, value);
        }
        return this;
    }

    whereIn(column: string, values: unknown[]): this {
        this.qb.whereIn(column, values);
        return this;
    }

    whereNotIn(column: string, values: unknown[]): this {
        this.qb.whereNotIn(column, values);
        return this;
    }

    whereNull(column: string): this {
        this.qb.whereNull(column);
        return this;
    }

    whereNotNull(column: string): this {
        this.qb.whereNotNull(column);
        return this;
    }

    whereBetween(column: string, range: [unknown, unknown]): this {
        this.qb.whereBetween(column, range);
        return this;
    }

    // ─── Chainable other methods ─────────────────────────────────

    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.qb.orderBy(column, direction);
        return this;
    }

    limit(limit: number): this {
        this.qb.limit(limit);
        return this;
    }

    offset(offset: number): this {
        this.qb.offset(offset);
        return this;
    }

    select(...columns: string[]): this {
        this.qb.select(...columns);
        return this;
    }

    groupBy(...columns: string[]): this {
        this.qb.groupBy(...columns);
        return this;
    }

    // ─── Eager Loading ───────────────────────────────────────────

    eagerLoad(...relations: string[]): this {
        this._eagerLoads.push(...relations);
        return this;
    }

    with(...relations: string[]): this {
        return this.eagerLoad(...relations);
    }

    // ─── Soft Delete Scopes ──────────────────────────────────────

    withDeleted(): this {
        // Don't add the whereNull('deleted_at') filter
        return this;
    }

    onlyDeleted(): this {
        this.qb.whereNotNull('deleted_at');
        return this;
    }

    // ─── Execution ───────────────────────────────────────────────

    /**
     * Get all matching records as hydrated model instances.
     */
    async get(): Promise<T[]> {
        const rows = await this.qb.get();
        const instances = rows.map((row) =>
            (this.ModelClass as any).hydrate(row as Record<string, unknown>),
        );

        // Process eager loads
        if (this._eagerLoads.length > 0 && instances.length > 0) {
            await this.processEagerLoads(instances);
        }

        return instances;
    }

    /**
     * Get the first matching record.
     */
    async first(): Promise<T | null> {
        this.qb.limit(1);
        const instances = await this.get();
        return instances[0] ?? null;
    }

    /**
     * Paginate results.
     */
    async paginate(page = 1, perPage = 15): Promise<PaginatedResult<T>> {
        const result = await this.qb.paginate(page, perPage);
        const instances = result.data.map((row) =>
            (this.ModelClass as any).hydrate(row as Record<string, unknown>),
        );

        if (this._eagerLoads.length > 0 && instances.length > 0) {
            await this.processEagerLoads(instances);
        }

        return {
            data: instances,
            meta: result.meta,
        };
    }

    /**
     * Count matching records.
     */
    async count(column = '*'): Promise<number> {
        return this.qb.count(column);
    }

    /**
     * Check if matching records exist.
     */
    async exists(): Promise<boolean> {
        return this.qb.exists();
    }

    /**
     * Get single column values.
     */
    async pluck<V = unknown>(column: string): Promise<V[]> {
        return this.qb.pluck<V>(column);
    }

    // ─── Private: Eager Loading ──────────────────────────────────

    private async processEagerLoads(instances: T[]): Promise<void> {
        for (const relationName of this._eagerLoads) {
            const instance = instances[0]!;
            const proto = Object.getPrototypeOf(instance);

            if (typeof proto[relationName] !== 'function') {
                continue; // Skip if relation method doesn't exist
            }

            // Get the relation definition
            const relation = proto[relationName].call(instance) as Relation;

            // Collect all local key values for batch loading
            const localValues = instances.map((inst) => (inst as any)[relation.localKey]);
            const uniqueValues = [...new Set(localValues)];

            if (uniqueValues.length === 0) continue;

            // Batch query: fetch all related records in one query
            const meta = getMetadata(relation['foreignModel']);
            const driver = getModelDriver();
            const relQb = new QueryBuilder(driver, getModelDialect(), meta.tableName);
            relQb.whereIn(relation.foreignKey, uniqueValues);
            const relatedRows = await relQb.get();

            // Group related records by foreign key
            const grouped = new Map<unknown, Record<string, unknown>[]>();
            for (const row of relatedRows) {
                const key = (row as Record<string, unknown>)[relation.foreignKey];
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(row as Record<string, unknown>);
            }

            // Assign to each instance
            for (const inst of instances) {
                const localValue = (inst as any)[relation.localKey];
                const related = grouped.get(localValue) || [];

                // Determine if HasOne/BelongsTo (single) or HasMany/ManyToMany (array)
                const relationType = relation.constructor.name;
                if (relationType === 'HasOne' || relationType === 'BelongsTo') {
                    inst.setRelation(relationName, related[0] || null);
                } else {
                    inst.setRelation(relationName, related);
                }
            }
        }
    }
}
