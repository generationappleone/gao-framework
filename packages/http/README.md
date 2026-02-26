# @gao/http

The foundational HTTP layer for the GAO Framework. It provides a robust, type-safe request/response pipeline designed for both Bun and Node.js.

## Features

-   **Type-Safe Request/Response wrapper:** Easy iteration over bodies, cookies, and queries.
-   **Decorator-Based Routing (`@Get`, `@Post`, `@Controller`)**
-   **Onion-Based Middleware Execution** (like Koa, `next()`)
-   **File Uploads with Stream-to-Disk handling** using busboy.
-   **Response Compression** (Brotli, Gzip, Deflate).
-   **Response Serialization (@Serialize)**.
-   **Developer Debug Toolbar**.
-   **Kubernetes Ready (`/health`)**.

## Basic Example

```typescript
import { Server, Controller, Get, GaoRequest, GaoResponse, MiddlewarePipeline } from '@gao/http';

@Controller('/users')
class UserController {
    @Get()
    public async list(req: GaoRequest, res: GaoResponse) {
        return res.json({ message: 'Hello Users' });
    }
}

const pipeline = new MiddlewarePipeline();

const server = new Server(async (req, res) => {
    return pipeline.execute(req, res, async () => {
        // Fallback handler if no route matches
        return res.status(404).text('Not Found');
    });
}, { port: 3000 });

server.listen();
```

## Security Limits
By default, the HTTP package guards against memory exhaustions with hard caps and streaming architectures:
- `maxBodySize`: Sets total size cap, completely destroying incoming sockets upon bounds exceedance. Defaults inherently to 1MB.

## Dev Tools
If `NODE_ENV=development` or running dynamically via toolbar settings:
- Error responses map into styled HTML stack trace interfaces.
- Any valid HTML response encapsulates an injected Debug Toolbar tracking latency boundaries and `process.memoryUsage` deltas.
