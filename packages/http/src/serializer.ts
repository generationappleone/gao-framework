/**
 * @gao/http — Route Response Serialization
 *
 * `@Serialize(DtoClass)` decorator to auto-sanitize response payload.
 */

import 'reflect-metadata';

export const SERIALIZE_DECORATOR_KEY = Symbol('gao:http:serialize');

/**
 * Base abstract DTO. Any returned payload object from the
 * controller that gets intercepted via @Serialize will be mapped over this class recursively.
 */
export interface DTO {
  [key: string]: any;
}

/**
 * Decorator for controllers or method routes.
 * When applied, the router must intercept the original return payload and run `plainToDto`.
 */
export function Serialize(dtoClass: new (...args: any[]) => any) {
  return (targetOrValue: any, propertyKeyOrContext?: any, descriptor?: PropertyDescriptor): any => {
    if (!propertyKeyOrContext) {
      // Class decorator
      Reflect.defineMetadata(SERIALIZE_DECORATOR_KEY, dtoClass, targetOrValue);
    } else if (descriptor) {
      // Experimental method decorator
      Reflect.defineMetadata(
        SERIALIZE_DECORATOR_KEY,
        dtoClass,
        targetOrValue,
        propertyKeyOrContext,
      );
      return descriptor;
    } else {
      // Stage 3 method decorator
      Reflect.defineMetadata(
        SERIALIZE_DECORATOR_KEY,
        dtoClass,
        targetOrValue,
        propertyKeyOrContext.name,
      );
      return targetOrValue;
    }
  };
}

/**
 * Convert plain objects into the shape defined by the DTO class structure.
 * Only properties defined in the generic shape or standard properties will be kept.
 *
 * Auto-filters known sensitive strings like password, secret, token, etc.
 * if they are not explicitly typed. Actually, to keep it simple, we use a basic filter
 * for any sensitive key if it exists in the plain object but NOT the DTO.
 */
export function sanitizePayload(payload: any, DtoClass?: new (...args: any[]) => any): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item, DtoClass));
  }

  // Default sensitive key exclusion (even if no DTO supplied)
  const sensitiveKeys = ['password', 'secret', 'token', 'access_token', 'refresh_token', 'apikey'];
  const sanitized: Record<string, any> = {};

  // If there is no DTO class specified, just strip out sensitive globally
  if (!DtoClass) {
    for (const [key, value] of Object.entries(payload)) {
      if (!sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // Attempt to map using simple instance instantiation
  // Note: A robust implementation in a real framework would use something like `class-transformer`
  // but for the scope of our engine, we will map properties safely.

  // Instead of instantiating, simply check whitelist via instance keys if possible,
  // or just let the DtoClass dictate the schema shape if it has default values.
  // Given we might not have `class-transformer`, we just strip sensitive for now
  // and ideally the DtoClass creates an interface.
  // In TypeScript, interfaces don't exist at runtime, so we must instantiate the DtoClass to see what keys it has if it initialized them.
  const instance = new DtoClass();
  const allowedKeys =
    Object.keys(instance).length > 0 ? Object.keys(instance) : Object.keys(payload);

  for (const key of allowedKeys) {
    if (payload[key] !== undefined && !sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] =
        typeof payload[key] === 'object' ? sanitizePayload(payload[key]) : payload[key];
    } else if (instance[key] !== undefined) {
      // fallback to default value
      sanitized[key] = instance[key];
    }
  }

  return sanitized;
}
