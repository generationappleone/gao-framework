# Testing Guide

GAO provides a powerful `@gao/testing` package to make testing your applications a breeze.

## Why use @gao/testing?

- **Zero-Config Test Apps**: Boot your app in `test` mode with in-memory SQLite automatically.
- **Fluent Assertions**: Expressive API for verifying HTTP responses.
- **Mocking Helpers**: Easily create fake requests and database states.

## Setting Up

First, ensure you have the testing package installed:

```bash
pnpm add -D @gao/testing vitest
```

## Writing Integration Tests

```ts
import { describe, it } from 'vitest';
import { createTestApp, request, expectResponse } from '@gao/testing';

describe('User API', () => {
  it('should list users', async () => {
    const app = await createTestApp();
    
    // Build a mock request
    const req = request('/api/users').get().build();
    
    // Handle the request through the app
    const res = await app.handle(req);
    
    // Assert against the response
    await expectResponse(res)
      .toBeSuccess()
      .toMatchSchema(UserSchema);
  });
});
```

## Custom Assertions

- `toBeSuccess(status?)`: Asserts status code and valid JSON envelope.
- `toBeError(status?, code?)`: Asserts error status and error code.
- `toHaveCorrelationId()`: Verifies tracing headers.
- `toMatchSchema(zodSchema)`: Validates payload data against a Zod schema.
