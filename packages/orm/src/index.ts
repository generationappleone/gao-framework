export * from './types.js';
export * from './drivers/driver.interface.js';
export * from './drivers/sqlite.js';
export * from './drivers/postgres.js';
export * from './drivers/mysql.js';
export * from './drivers/mariadb.js';
export * from './connection.js';
export * from './schema.js';
export * from './model.js';
export * from './query-builder.js';
export * from './migration.js';
export * from './decorators.js';
export * from './relations.js';
export * from './pagination.js';
export * from './hooks.js';
export * from './seeder.js';
export * from './active-record.js';
export * from './collection.js';
export * from './scopes.js';

// New relation types (not in legacy relations.ts) — re-export explicitly
export { HasOneThrough } from './relations/has-one-through.js';
export { HasManyThrough } from './relations/has-many-through.js';
export { MorphOne } from './relations/morph-one.js';
export { MorphMany } from './relations/morph-many.js';
export { MorphTo, registerMorphMap, resolveMorphType } from './relations/morph-to.js';
export { MorphToMany } from './relations/morph-to-many.js';
// New relation base class from relations/ (different constructor than legacy)
export { Relation as RelationBase } from './relations/relation.js';
export { HasOne as HasOneRelation } from './relations/has-one.js';
export { HasMany as HasManyRelation } from './relations/has-many.js';
export { BelongsTo as BelongsToRelation } from './relations/belongs-to.js';
export { ManyToMany as ManyToManyRelation } from './relations/many-to-many.js';

// Expression Builder — OOP SQL expressions
export { Expr } from './expressions/expr.js';
export type { Expression, ExpressionResult, Dialect as ExprDialect, CastType } from './expressions/expression.js';
export { isExpression, ExpressionCompiler } from './expressions/expression.js';
export { ColumnExpr } from './expressions/column.js';
export { LiteralExpr } from './expressions/literal.js';
export { RawExpr } from './expressions/raw.js';
export { AliasExpr } from './expressions/alias.js';
export { CastExpr } from './expressions/cast.js';
export { ArithmeticExpr } from './expressions/arithmetic.js';
export { CaseWhenExpr } from './expressions/case-when.js';
export { JsonExtractExpr, JsonContainsExpr } from './expressions/json.js';
export { SubQueryExpr } from './expressions/subquery.js';
export { AggregateExpr } from './expressions/functions/aggregate.js';
export { CoalesceExpr, NullIfExpr } from './expressions/functions/null-handling.js';
export { NowExpr, ExtractExpr } from './expressions/functions/date.js';
export { UnaryFunctionExpr, ConcatExpr, SubstringExpr, ReplaceExpr } from './expressions/functions/string.js';
