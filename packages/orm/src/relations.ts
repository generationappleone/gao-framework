/**
 * @gao/orm — Model Relations
 *
 * Provides relation types: HasOne, HasMany, BelongsTo, ManyToMany.
 */

import { getMetadata } from './decorators.js';
import type { DatabaseDriver } from './drivers/driver.interface.js';
import type { BaseModel } from './model.js';
import { QueryBuilder } from './query-builder.js';

export abstract class Relation<TModel extends BaseModel = any> {
  constructor(
    protected foreignModel: new (...args: any[]) => TModel,
    public localKey: string,
    public foreignKey: string,
  ) {}

  protected getTableName(model: new (...args: any[]) => any): string {
    return getMetadata(model).tableName || model.name.toLowerCase() + 's';
  }

  abstract query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel>;
}

export class HasOne<TModel extends BaseModel> extends Relation<TModel> {
  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const tableName = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, 'postgres', tableName)
      .where(this.foreignKey, '=', localValue)
      .limit(1);
  }
}

export class HasMany<TModel extends BaseModel> extends Relation<TModel> {
  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const tableName = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, 'postgres', tableName).where(
      this.foreignKey,
      '=',
      localValue,
    );
  }
}

export class BelongsTo<TModel extends BaseModel> extends Relation<TModel> {
  query(driver: DatabaseDriver, localValue: any): QueryBuilder<TModel> {
    const tableName = this.getTableName(this.foreignModel);
    return new QueryBuilder<TModel>(driver, 'postgres', tableName)
      .where(this.localKey, '=', localValue) // Here localKey points to the PK of foreign model
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
    // SELECT * FROM foreignTable INNER JOIN pivotTable ON foreignTable.foreignKey = pivotTable.pivotForeignKey WHERE pivotTable.pivotLocalKey = ?
    return new QueryBuilder<TModel>(driver, 'postgres', foreignTable)
      .join(
        this.pivotTable,
        `${foreignTable}.${this.foreignKey}`,
        '=',
        `${this.pivotTable}.${this.pivotForeignKey}`,
      )
      .where(`${this.pivotTable}.${this.pivotLocalKey}`, '=', localValue);
  }
}
