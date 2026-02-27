/**
 * @gao/core — Dependency Injection Decorators
 *
 * Enables constructor injection in controllers and services.
 *
 * Usage:
 * ```ts
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @Inject('db') private db: DatabaseDriver,
 *     @Inject(Logger) private logger: Logger,
 *   ) {}
 * }
 * ```
 */

// reflect-metadata must be loaded at runtime (imported by the application entry point)
// We use (Reflect as any) to avoid strict TS errors without adding reflect-metadata as a dependency

/**
 * Metadata key for inject tokens stored on constructor parameters.
 */
export const INJECT_METADATA_KEY = Symbol('gao:inject:tokens');

/**
 * Metadata key to mark a class as injectable.
 */
export const INJECTABLE_METADATA_KEY = Symbol('gao:inject:injectable');

/**
 * Token type — can be a string, symbol, or class constructor.
 */
export type InjectToken = string | symbol | (new (...args: any[]) => any);

/**
 * Parameter decorator to specify what should be injected.
 *
 * @param token - Service token: string key, symbol, or class reference
 */
export function Inject(token: InjectToken) {
    return (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const existingTokens: Map<number, InjectToken> =
            (Reflect as any).getOwnMetadata(INJECT_METADATA_KEY, target) || new Map();
        existingTokens.set(parameterIndex, token);
        (Reflect as any).defineMetadata(INJECT_METADATA_KEY, existingTokens, target);
    };
}

/**
 * Class decorator to mark a class as injectable.
 * This allows the DI container to auto-resolve constructor dependencies.
 */
export function Injectable() {
    return (target: new (...args: any[]) => any) => {
        (Reflect as any).defineMetadata(INJECTABLE_METADATA_KEY, true, target);
        return target;
    };
}

/**
 * Read the inject tokens for a given class constructor.
 */
export function getInjectTokens(target: any): Map<number, InjectToken> {
    return (Reflect as any).getOwnMetadata(INJECT_METADATA_KEY, target) || new Map();
}

/**
 * Check if a class is marked as @Injectable.
 */
export function isInjectable(target: any): boolean {
    return (Reflect as any).getOwnMetadata(INJECTABLE_METADATA_KEY, target) === true;
}
