import { describe, expect, it } from 'vitest';
import { createContainer } from '../src/container.js';
import { InternalError } from '../src/errors.js';

describe('DI Container', () => {
  it('should register and resolve a transient dependency', () => {
    const container = createContainer();
    let counter = 0;
    container.transient('counter', () => ++counter);

    expect(container.resolve('counter')).toBe(1);
    expect(container.resolve('counter')).toBe(2);
  });

  it('should register and resolve a singleton dependency', () => {
    const container = createContainer();
    let counter = 0;
    container.singleton('counter', () => ++counter);

    expect(container.resolve('counter')).toBe(1);
    expect(container.resolve('counter')).toBe(1);
  });

  it('should detect circular dependencies', () => {
    const container = createContainer();
    container.transient('a', () => container.resolve('b'));
    container.transient('b', () => container.resolve('c'));
    container.transient('c', () => container.resolve('a'));

    expect(() => container.resolve('a')).toThrow(InternalError);
    expect(() => container.resolve('a')).toThrow(/Circular dependency detected/);
  });

  it('should throw when resolving unregistered dependency', () => {
    const container = createContainer();
    expect(() => container.resolve('not-found')).toThrow(InternalError);
  });
});
