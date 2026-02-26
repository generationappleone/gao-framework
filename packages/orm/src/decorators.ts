/**
 * @gao/orm — Model Decorators
 *
 * Provides metadata routing for models using TypeScript decorators.
 */

export const ORM_METADATA_KEY = Symbol('gao:orm:metadata');

export interface ColumnOptions {
  type?: string;
  nullable?: boolean;
  default?: unknown;
  primary?: boolean;
}

export interface IndexOptions {
  name?: string;
  unique?: boolean;
}

export interface ForeignKeyOptions {
  table: string;
  column: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface ModelMetadata {
  tableName: string;
  columns: Record<string, ColumnOptions>;
  indexes: Record<string, IndexOptions>;
  uniques: string[];
  foreignKeys: Record<string, ForeignKeyOptions>;
  encryptedFields: string[];
  hooks: {
    beforeSave: string[];
    afterSave: string[];
    beforeDelete: string[];
    afterDelete: string[];
  };
  scopes: Record<string, string>;
}

/**
 * Retrieves or initializes the metadata for a model class.
 */
export function getMetadata(target: any): ModelMetadata {
  if (!target[ORM_METADATA_KEY]) {
    target[ORM_METADATA_KEY] = {
      tableName: target.name.toLowerCase() + 's',
      columns: {},
      indexes: {},
      uniques: [],
      foreignKeys: {},
      encryptedFields: [],
      hooks: {
        beforeSave: [],
        afterSave: [],
        beforeDelete: [],
        afterDelete: [],
      },
      scopes: {},
    };
  }
  return target[ORM_METADATA_KEY];
}

/**
 * Class decorator to define the table name.
 */
export function Table(name: string) {
  return ((target: new (...args: any[]) => any) => {
    const meta = getMetadata(target);
    meta.tableName = name;
  }) as any;
}

/**
 * Property decorator to define a column.
 */
export function Column(options: ColumnOptions = {}) {
  return (target: any, propertyKey: string) => {
    const meta = getMetadata(target.constructor);
    meta.columns[propertyKey] = options;
  };
}

/**
 * Property decorator to define an index.
 */
export function Index(options: IndexOptions = {}) {
  return (target: any, propertyKey: string) => {
    const meta = getMetadata(target.constructor);
    meta.indexes[propertyKey] = options;
  };
}

/**
 * Property decorator to mark a column as unique.
 */
export function Unique() {
  return (target: any, propertyKey: string) => {
    const meta = getMetadata(target.constructor);
    meta.uniques.push(propertyKey);
  };
}

/**
 * Property decorator to define a foreign key relationship.
 */
export function ForeignKey(options: ForeignKeyOptions) {
  return (target: any, propertyKey: string) => {
    const meta = getMetadata(target.constructor);
    meta.foreignKeys[propertyKey] = options;
  };
}

/**
 * Property decorator to mark a field for auto-encryption.
 */
export function Encrypted() {
  return (target: any, propertyKey: string) => {
    const meta = getMetadata(target.constructor);
    meta.encryptedFields.push(propertyKey);
  };
}
