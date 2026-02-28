/**
 * @gao/orm — Model Relations (Backward Compatibility)
 *
 * This file re-exports relation classes from the new `relations/` directory.
 * Existing imports from './relations.js' remain valid.
 *
 * NOTE: The new relation classes use a different constructor signature
 * (parent instance as first arg). This compatibility layer provides
 * wrapper classes that match the old constructor signatures for
 * backward compatibility with existing code.
 */

import { getMetadata } from './decorators.js';
import type { DatabaseDriver } from './drivers/driver.interface.js';
import type { BaseModel } from './model.js';
import { QueryBuilder } from './query-builder.js';
import { getModelDialect } from './active-record.js';

type Dialect = 'postgres' | 'sqlite' | 'mysql' | 'mariadb';

/**
 * Legacy Relation base class.
 * Kept for backward compatibility with existing code that uses:
 *   new HasOne(ForeignModel, localKey, foreignKey)
 */
export abstract class Relation<TModel extends BaseModel = any> {
  constructor(
    protected foreignModel: new (...args: any[]) => TModel,
    public localKey: string,
    public foreignKey: string,
  ) { }

  protected getTableName(model: new (...args: any[]) => any): string {
    return getMetadata(model).tableName || model.name.toLowerCase() + 's';
  }

  protected resolveDialect(): Dialect {
    return getModelDialect();
  }

  abstract query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel>;
}

export class HasOne<TModel extends BaseModel> extends Relation<TModel> {
  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const tableName = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, this.resolveDialect(), tableName)
      .where(this.foreignKey, '=', localValue)
      .limit(1);
  }
}

export class HasMany<TModel extends BaseModel> extends Relation<TModel> {
  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const tableName = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, this.resolveDialect(), tableName).where(
      this.foreignKey,
      '=',
      localValue,
    );
  }
}

export class BelongsTo<TModel extends BaseModel> extends Relation<TModel> {
  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const tableName = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, this.resolveDialect(), tableName)
      .where(this.localKey, '=', localValue)
      .limit(1);
  }
}

export class ManyToMany<TModel extends BaseModel> extends Relation<TModel> {
  constructor(
    foreignModel: new (...args: any[]) => TModel,
    localKey: string,
    foreignKey: string,
    public pivotTable: string,
    public pivotLocalKey: string,
    public pivotForeignKey: string,
  ) {
    super(foreignModel, localKey, foreignKey);
  }

  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const foreignTable = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, this.resolveDialect(), foreignTable)
      .join(
        this.pivotTable,
        `${foreignTable}.${this.foreignKey}`,
        '=',
        `${this.pivotTable}.${this.pivotForeignKey}`,
      )
      .where(`${this.pivotTable}.${this.pivotLocalKey}`, '=', localValue);
  }
}
