import { expect } from 'vitest';
import type { ZodType } from 'zod';

export class ResponseAssertion {
    constructor(private res: Response, private payload?: any) { }

    /**
     * Automatically extract JSON payload if not provided
     */
    private async getPayload() {
        if (this.payload !== undefined) return this.payload;
        if (this.res.headers.get('content-type')?.includes('application/json')) {
            this.payload = await this.res.clone().json();
        }
        return this.payload;
    }

    /**
     * Asserts the response has a success status and valid data envelope
     */
    async toBeSuccess(expectedStatus = 200) {
        expect(this.res.status).toBe(expectedStatus);
        const payload = await this.getPayload();
        expect(payload).toBeDefined();
        expect(payload).toHaveProperty('data');
        expect(payload).not.toHaveProperty('error');
        return this;
    }

    /**
     * Asserts the response has an error status and valid error envelope
     */
    async toBeError(expectedStatus = 400, expectedCode?: string) {
        expect(this.res.status).toBe(expectedStatus);
        const payload = await this.getPayload();
        expect(payload).toBeDefined();
        expect(payload).toHaveProperty('error');
        if (expectedCode) {
            expect(payload.error.code).toBe(expectedCode);
        }
        return this;
    }

    /**
     * Asserts the response contains a correlation ID header
     */
    toHaveCorrelationId() {
        expect(this.res.headers.has('x-correlation-id')).toBe(true);
        return this;
    }

    /**
     * Asserts the response data matches a specific Zod schema
     */
    async toMatchSchema(schema: ZodType<any>) {
        const payload = await this.getPayload();
        expect(payload).toBeDefined();

        // We only test the data portion if it's an envelope, otherwise the whole payload
        const dataToTest = payload.data !== undefined ? payload.data : payload;

        const result = schema.safeParse(dataToTest);
        if (!result.success) {
            // Provide meaningful error to vitest
            expect(result.error.issues).toEqual([]);
        }
        return this;
    }

    /**
     * Raw payload access for further custom assertions
     */
    async getRawPayload() {
        return await this.getPayload();
    }
}

/**
 * Fluent assertion wrapper for Response objects
 */
export function expectResponse(res: Response | Promise<Response>) {
    if (res instanceof Promise) {
        // If it's a promise, we return an object with methods that resolve it first
        return {
            async toBeSuccess(s?: number) { return new ResponseAssertion(await res).toBeSuccess(s); },
            async toBeError(s?: number, c?: string) { return new ResponseAssertion(await res).toBeError(s, c); },
            async toHaveCorrelationId() { return new ResponseAssertion(await res).toHaveCorrelationId(); },
            async toMatchSchema(schema: ZodType<any>) { return new ResponseAssertion(await res).toMatchSchema(schema); },
        };
    }
    return new ResponseAssertion(res);
}
