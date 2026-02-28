/**
 * @gao/orm — Relations Index
 *
 * Re-exports all relation types for convenient imports.
 */

export { Relation } from './relation.js';
export type { Dialect } from './relation.js';
export { HasOne } from './has-one.js';
export { HasMany } from './has-many.js';
export { BelongsTo } from './belongs-to.js';
export { ManyToMany } from './many-to-many.js';
export { HasOneThrough } from './has-one-through.js';
export { HasManyThrough } from './has-many-through.js';
export { MorphOne } from './morph-one.js';
export { MorphMany } from './morph-many.js';
export { MorphTo, registerMorphMap, resolveMorphType } from './morph-to.js';
export { MorphToMany } from './morph-to-many.js';
