/**
 * @gao/orm — Expressions Index
 *
 * Barrel export for all expression types.
 */

export type { Expression, ExpressionResult, Dialect, CastType } from './expression.js';
export { isExpression, ExpressionCompiler } from './expression.js';
export { ColumnExpr } from './column.js';
export { LiteralExpr } from './literal.js';
export { RawExpr } from './raw.js';
export { AliasExpr } from './alias.js';
export { CastExpr } from './cast.js';
export { ArithmeticExpr } from './arithmetic.js';
export type { ArithmeticOp } from './arithmetic.js';
export { UnaryFunctionExpr, ConcatExpr, SubstringExpr, ReplaceExpr } from './functions/string.js';
export { NowExpr, ExtractExpr } from './functions/date.js';
export type { DatePart } from './functions/date.js';
export { CoalesceExpr, NullIfExpr } from './functions/null-handling.js';
export { AggregateExpr } from './functions/aggregate.js';
export { CaseWhenExpr } from './case-when.js';
export { JsonExtractExpr, JsonContainsExpr, JsonAccessExpr } from './json.js';
export { SubQueryExpr } from './subquery.js';
export { Expr } from './expr.js';
