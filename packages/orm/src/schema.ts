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
  | 'timestamp'
  | 'decimal'
  | 'numeric'
  | 'json'
  | 'jsonb'
  | 'date'
  | 'time'
  | 'serial'
  | 'bigserial';

export class ColumnBuilder {
  private isPrimary = false;
  private isNullable = false;
  private isUnique = false;
  private defaultValue?: string;

  constructor(
    public name: string,
    public type: ColumnType,
    public length?: number,
    public precision?: number,
    public scale?: number,
  ) { }

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
    if (
      typeof val === 'string' &&
      val !== 'CURRENT_TIMESTAMP' &&
      val !== 'NOW()' &&
      val !== 'CURRENT_DATE' &&
      val !== 'CURRENT_TIME'
    ) {
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
      case 'decimal':
      case 'numeric': {
        const p = this.precision ?? 10;
        const s = this.scale ?? 2;
        sql += `${this.type.toUpperCase()}(${p}, ${s})`;
        break;
      }
      case 'json':
        sql += 'JSON';
        break;
      case 'jsonb':
        sql += 'JSONB';
        break;
      case 'date':
        sql += 'DATE';
        break;
      case 'time':
        sql += 'TIME';
        break;
      case 'serial':
        sql += 'SERIAL';
        break;
      case 'bigserial':
        sql += 'BIGSERIAL';
        break;
    }

    if (this.isPrimary) sql += ' PRIMARY KEY';
    if (!this.isNullable && !this.isPrimary && this.type !== 'serial' && this.type !== 'bigserial')
      sql += ' NOT NULL';
    if (this.isUnique) sql += ' UNIQUE';
    if (this.defaultValue !== undefined) sql += ` DEFAULT ${this.defaultValue}`;

    return sql;
  }
}

interface ForeignKeyDefinition {
  column: string;
  referenceTable: string;
  referenceColumn: string;
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
}

interface CheckDefinition {
  expression: string;
  name?: string;
}

export class TableBuilder {
  public columns: ColumnBuilder[] = [];
  public foreignKeys: ForeignKeyDefinition[] = [];
  public indexes: IndexDefinition[] = [];
  public checks: CheckDefinition[] = [];

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

  decimal(name: string, precision = 10, scale = 2): ColumnBuilder {
    const col = new ColumnBuilder(name, 'decimal', undefined, precision, scale);
    this.columns.push(col);
    return col;
  }

  numeric(name: string, precision = 10, scale = 2): ColumnBuilder {
    const col = new ColumnBuilder(name, 'numeric', undefined, precision, scale);
    this.columns.push(col);
    return col;
  }

  json(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'json');
    this.columns.push(col);
    return col;
  }

  jsonb(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'jsonb');
    this.columns.push(col);
    return col;
  }

  date(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'date');
    this.columns.push(col);
    return col;
  }

  time(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'time');
    this.columns.push(col);
    return col;
  }

  serial(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'serial');
    this.columns.push(col);
    return col;
  }

  bigserial(name: string): ColumnBuilder {
    const col = new ColumnBuilder(name, 'bigserial');
    this.columns.push(col);
    return col;
  }

  enum(name: string, values: string[]): ColumnBuilder {
    this.checks.push({
      expression: `"${name}" IN (${values.map((v) => `'${v}'`).join(', ')})`,
      name: `chk_${name}_enum`,
    });
    const col = new ColumnBuilder(name, 'varchar', 255);
    this.columns.push(col);
    return col;
  }

  timestamps(): void {
    this.timestamp('created_at').default('CURRENT_TIMESTAMP');
    this.timestamp('updated_at').nullable();
    this.timestamp('deleted_at').nullable();
  }

  foreignKey(
    column: string,
    referenceTable: string,
    referenceColumn = 'id',
    onDelete: ForeignKeyDefinition['onDelete'] = 'CASCADE',
    onUpdate: ForeignKeyDefinition['onUpdate'] = 'NO ACTION',
  ): void {
    this.foreignKeys.push({ column, referenceTable, referenceColumn, onDelete, onUpdate });
  }

  index(columns: string | string[], name?: string, unique = false): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const indexName = name || `idx_${cols.join('_')}`;
    this.indexes.push({ name: indexName, columns: cols, unique });
  }

  uniqueIndex(columns: string | string[], name?: string): void {
    this.index(columns, name, true);
  }

  check(expression: string, name?: string): void {
    this.checks.push({ expression, name });
  }
}

export class AlterTableBuilder {
  private operations: string[] = [];

  constructor(private tableName: string) { }

  addColumn(builder: ColumnBuilder): this {
    this.operations.push(`ADD COLUMN ${builder.compile()}`);
    return this;
  }

  dropColumn(name: string): this {
    this.operations.push(`DROP COLUMN "${name}"`);
    return this;
  }

  renameColumn(oldName: string, newName: string): this {
    this.operations.push(`RENAME COLUMN "${oldName}" TO "${newName}"`);
    return this;
  }

  addForeignKey(
    column: string,
    referenceTable: string,
    referenceColumn = 'id',
    onDelete: ForeignKeyDefinition['onDelete'] = 'CASCADE',
  ): this {
    this.operations.push(
      `ADD CONSTRAINT "fk_${this.tableName}_${column}" FOREIGN KEY ("${column}") REFERENCES "${referenceTable}"("${referenceColumn}") ON DELETE ${onDelete}`,
    );
    return this;
  }

  dropConstraint(name: string): this {
    this.operations.push(`DROP CONSTRAINT "${name}"`);
    return this;
  }

  compile(): string[] {
    return this.operations.map((op) => `ALTER TABLE "${this.tableName}" ${op};`);
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Schema acts as a namespace for builder
export class Schema {
  static create(tableName: string, callback: (t: TableBuilder) => void): string {
    const builder = new TableBuilder();
    callback(builder);

    const parts: string[] = [];

    // Column definitions
    parts.push(...builder.columns.map((c) => c.compile()));

    // Foreign keys
    for (const fk of builder.foreignKeys) {
      parts.push(
        `CONSTRAINT "fk_${tableName}_${fk.column}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referenceTable}"("${fk.referenceColumn}") ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`,
      );
    }

    // Check constraints
    for (const chk of builder.checks) {
      const name = chk.name ? `CONSTRAINT "${chk.name}" ` : '';
      parts.push(`${name}CHECK (${chk.expression})`);
    }

    let sql = `CREATE TABLE "${tableName}" (\n  ${parts.join(',\n  ')}\n);`;

    // Index statements (separate from CREATE TABLE)
    for (const idx of builder.indexes) {
      const uniqueStr = idx.unique ? 'UNIQUE ' : '';
      const colsSql = idx.columns.map((c) => `"${c}"`).join(', ');
      sql += `\nCREATE ${uniqueStr}INDEX "${idx.name}" ON "${tableName}" (${colsSql});`;
    }

    return sql;
  }

  static drop(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}";`;
  }

  static alter(tableName: string, callback: (t: AlterTableBuilder) => void): string[] {
    const builder = new AlterTableBuilder(tableName);
    callback(builder);
    return builder.compile();
  }

  static dropIfExists(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}" CASCADE;`;
  }

  static rename(oldName: string, newName: string): string {
    return `ALTER TABLE "${oldName}" RENAME TO "${newName}";`;
  }
}
