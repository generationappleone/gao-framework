/**
 * @gao/orm — Schema Builder
 *
 * Fluent API for generating SQL DDL statements.
 */

export type ColumnType =
  | 'uuid'
  | 'varchar'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'boolean'
  | 'timestamp';

export class ColumnBuilder {
  private isPrimary = false;
  private isNullable = false;
  private isUnique = false;
  private defaultValue?: string;

  constructor(
    public name: string,
    public type: ColumnType,
    public length?: number,
  ) {}

  primary(): this {
    this.isPrimary = true;
    return this;
  }

  nullable(): this {
    this.isNullable = true;
    return this;
  }

  unique(): this {
    this.isUnique = true;
    return this;
  }

  default(val: string | number | boolean): this {
    if (typeof val === 'string' && val !== 'CURRENT_TIMESTAMP') {
      this.defaultValue = `'${val}'`;
    } else {
      this.defaultValue = String(val);
    }
    return this;
  }

  compile(): string {
    let sql = `"${this.name}" `;

    switch (this.type) {
      case 'varchar':
        sql += `VARCHAR(${this.length ?? 255})`;
        break;
      case 'uuid':
        sql += 'UUID';
        break;
      case 'text':
        sql += 'TEXT';
        break;
      case 'integer':
        sql += 'INTEGER';
        break;
      case 'bigint':
        sql += 'BIGINT';
        break;
      case 'boolean':
        sql += 'BOOLEAN';
        break;
      case 'timestamp':
        sql += 'TIMESTAMP';
        break;
    }

    if (this.isPrimary) sql += ' PRIMARY KEY';
    if (!this.isNullable && !this.isPrimary) sql += ' NOT NULL';
    if (this.isUnique) sql += ' UNIQUE';
    if (this.defaultValue !== undefined) sql += ` DEFAULT ${this.defaultValue}`;

    return sql;
  }
}

export class TableBuilder {
  public columns: ColumnBuilder[] = [];

  uuid(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'uuid');
    this.columns.push(col);
    return col;
  }

  string(name: string, length = 255): ColumnBuilder {
    const col = new ColumnBuilder(name, 'varchar', length);
    this.columns.push(col);
    return col;
  }

  text(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'text');
    this.columns.push(col);
    return col;
  }

  integer(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'integer');
    this.columns.push(col);
    return col;
  }

  bigint(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'bigint');
    this.columns.push(col);
    return col;
  }

  boolean(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'boolean');
    this.columns.push(col);
    return col;
  }

  timestamp(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'timestamp');
    this.columns.push(col);
    return col;
  }

  timestamps(): void {
    this.timestamp('created_at').default('CURRENT_TIMESTAMP');
    this.timestamp('updated_at').nullable();
    this.timestamp('deleted_at').nullable();
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Schema acts as a namespace for builder
export class Schema {
  static create(tableName: string, callback: (t: TableBuilder) => void): string {
    const builder = new TableBuilder();
    callback(builder);

    const columnsSql = builder.columns.map((c) => c.compile()).join(',\n  ');
    return `CREATE TABLE "${tableName}" (\n  ${columnsSql}\n);`;
  }

  static drop(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}";`;
  }
}
