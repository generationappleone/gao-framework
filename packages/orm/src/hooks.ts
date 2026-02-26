/**
 * @gao/orm — Model Hooks & Lifecycle
 *
 * Provides lifecycle decorators like @BeforeSave, @AfterSave.
 */

import { getMetadata } from './decorators.js';

export function BeforeSave() {
  return (target: any, propertyKey: string) => {
    getMetadata(target.constructor).hooks.beforeSave.push(propertyKey);
  };
}

export function AfterSave() {
  return (target: any, propertyKey: string) => {
    getMetadata(target.constructor).hooks.afterSave.push(propertyKey);
  };
}

export function BeforeDelete() {
  return (target: any, propertyKey: string) => {
    getMetadata(target.constructor).hooks.beforeDelete.push(propertyKey);
  };
}

export function AfterDelete() {
  return (target: any, propertyKey: string) => {
    getMetadata(target.constructor).hooks.afterDelete.push(propertyKey);
  };
}

/**
 * Executes a specific lifecycle hook on a given model instance.
 */
export async function executeHooks(
  modelInstance: any,
  hookType: 'beforeSave' | 'afterSave' | 'beforeDelete' | 'afterDelete',
) {
  const meta = getMetadata(modelInstance.constructor);
  const hooks = meta.hooks[hookType];

  for (const hookName of hooks) {
    if (typeof modelInstance[hookName] === 'function') {
      await modelInstance[hookName]();
    }
  }
}
