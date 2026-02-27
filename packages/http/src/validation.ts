/**
 * @gao/http — Request Validation
 *
 * Zod-based request validation with decorator and imperative APIs.
 */

import { type ZodSchema, type ZodError } from 'zod';

/**
 * Validation error with field-level messages.
 */
export class HttpValidationError extends Error {
    public readonly statusCode = 422;
    public readonly errors: Record<string, string[]>;

    constructor(zodError: ZodError) {
        super('Validation failed');
        this.name = 'HttpValidationError';
        this.errors = {};

        for (const issue of zodError.issues) {
            const field = issue.path.join('.');
            if (!this.errors[field]) {
                this.errors[field] = [];
            }
            this.errors[field]!.push(issue.message);
        }
    }

    toJSON() {
        return {
            error: {
                code: 'VALIDATION_ERROR',
                message: this.message,
                errors: this.errors,
            },
        };
    }
}

/**
 * Validate data against a Zod schema.
 * Returns typed result or throws HttpValidationError.
 */
export function validateData<T>(schema: ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new HttpValidationError(result.error);
    }
    return result.data;
}

/**
 * Metadata key for validation schemas on route handlers.
 */
export const VALIDATION_METADATA_KEY = Symbol('gao:http:validation');

/**
 * Method decorator to validate request body before handler runs.
 *
 * Usage:
 * ```ts
 * @Post('/contacts')
 * @Validate(CreateContactSchema)
 * async create(req: GaoRequest, res: GaoResponse) {
 *   const data = req.validated<CreateContact>();
 * }
 * ```
 */
export function Validate<T>(schema: ZodSchema<T>) {
    return (target: any, propertyKey: string, _descriptor?: PropertyDescriptor) => {
        const schemas: Map<string, ZodSchema> =
            Reflect.getMetadata(VALIDATION_METADATA_KEY, target.constructor) || new Map();
        schemas.set(propertyKey, schema);
        Reflect.defineMetadata(VALIDATION_METADATA_KEY, schemas, target.constructor);
    };
}

/**
 * Get the validation schema for a specific handler.
 */
export function getValidationSchema(
    target: any,
    handlerName: string,
): ZodSchema | undefined {
    const schemas: Map<string, ZodSchema> | undefined =
        Reflect.getMetadata(VALIDATION_METADATA_KEY, target.constructor || target);
    return schemas?.get(handlerName);
}
