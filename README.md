<div align="center">

# 🚀 GAO Framework
v0.2: WebSocket support, OpenAPI auto-generation, Redis adapter
v0.3: GraphQL support, Real-time channels
**The Next-Generation TypeScript Full-Stack Multi-Platform Framework**

*Security-by-Default • High Performance • Rapid Development • Multi-Platform Build*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2+-black?logo=bun&logoColor=white)](https://bun.sh/)
[![Security](https://img.shields.io/badge/Security-Strict-red?logo=shield&logoColor=white)](#-security-fortress)
[![Monorepo](https://img.shields.io/badge/Monorepo-Turborepo-orange?logo=vercel&logoColor=white)](#-monorepo-packages)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop%20%7C%20Mobile-green?logo=electron&logoColor=white)](#-multi-platform-ready)
[![CI](https://img.shields.io/badge/CI-Passing-brightgreen?logo=github-actions&logoColor=white)](#)

</div>

---

## 🌟 Overview

**GAO Framework** is a full-stack TypeScript framework purpose-built for the era of *AI-Assisted Development* (*vibe coding*). It enforces **Security-by-Default** policies at every layer, ensuring that applications — even those with AI-generated code — are always production-safe.

GAO runs on **[Bun](https://bun.sh/)** (with Node.js 22+ LTS fallback) and follows a strict **Convention-over-Configuration** philosophy so developers can focus on business logic instead of wrestling with boilerplate and config files.

### Why GAO?

- **AI-Proof by Design** — Strict types, parameterized queries, and mandatory validation make it impossible for AI to introduce common vulnerabilities.
- **One Codebase, Three Platforms** — Write once, deploy to Web (SSR/API), Desktop (Tauri v2), and Mobile (Capacitor).
- **Zero .env Files** — All configuration lives in a type-safe `gao.config.ts` validated by Zod at startup.
- **Enterprise Security Out-of-the-Box** — CSRF, CORS, Rate Limiting, DDoS Shield, Helmet, XSS Guard, AES-256-GCM encryption, Argon2id hashing, JWT — all active by default.

---

## ✨ Key Features

### 🔒 1. Security-by-Default

- **No `.env` Files** — Configuration is managed through `gao.config.ts`, type-safe and validated by **Zod**. Missing or invalid config crashes at boot — never silently fails.
- **Full Security Middleware Stack** — CSRF, CORS, Rate Limiting, DDoS Shield, CAPTCHA (Turnstile), Helmet, XSS Guard, and Input Validation are all active by default.
- **Enterprise-Grade Encryption** — Native AES-256-GCM encryption & Argon2id password hashing.
- **Field-Level Encryption** — Transparent database column encryption via the `@Encrypted()` decorator.
- **RBAC & Guards** — Role-Based Access Control with `@Guard()` decorators on routes.

### 🚀 2. High Performance

- **Radix-Tree Router** — O(log n) lookup with support for static, parametric (`:id`), and wildcard routes.
- **Bun-Optimized** — Built to take full advantage of the Bun runtime.
- **Built-in Compression** — Gzip/Brotli response compression enabled by default.
- **Compiled Templates** — View engine compiles templates to JavaScript functions for maximum SSR throughput.

### ⚡ 3. Rapid Development

- **GAO CLI** (`@gao/cli`) — Scaffold projects, generate controllers, models, views, and migrations from the command line.
- **Debug Toolbar** — Request inspector, query logger, and auto-profiler in development mode.
- **Dependency Injection** — Built-in DI container with singleton/transient support and circular dependency detection.
- **Convention-over-Configuration** — Sensible defaults for everything; override only what you need.

### 🌍 4. Multi-Platform Build

- **Web** — Server-Side Rendered HTML and REST APIs.
- **Desktop** — Windows, Linux, and macOS applications via **Tauri v2** with type-safe IPC.
- **Mobile** — Android (APK/AAB) and iOS via **Capacitor** with native plugin wrappers.
- **Platform Detection** — `Platform.is('web')`, `Platform.is('desktop')`, `Platform.is('mobile')` for conditional logic.

### 🛡️ 5. Type-Safe Database (ORM)

- **Query Builder** — Pure parameterized queries only (zero string concatenation, zero SQL injection).
- **Multi-Driver** — PostgreSQL, MySQL, MariaDB, and SQLite.
- **Enterprise Features** — Soft deletes, auto audit fields (`created_at`, `updated_at`), migration engine, transaction savepoints, model hooks, and relation loading.

### 🎨 6. View Engine

- **Custom `.gao` Templates** — Auto-escaping by default (XSS-safe), with `${expression}` for escaped output and `!{expression}` for raw HTML.
- **Layout Inheritance** — Master layouts with `<@ section() @>` / `<@ yieldSection() @>` blocks.
- **Component System** — Reusable components with typed props and slots.
- **Built-in Helpers** — `url()`, `asset()`, `csrf()`, `can()`, `old()`, `paginate()` available in all templates.

---

## 🏗 Architecture

GAO Framework follows a layered request lifecycle pipeline:

```text
Client Request
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Bun Server (Node.js fallback)                  │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Security Middleware Stack                    │
  │  Helmet → CORS → CSRF → Rate Limiter        │
  │  → DDoS Shield → XSS Guard                  │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Router (Radix Tree — O(log n) matching)     │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Validation Layer (Zod Schema)               │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Controller → Service → ORM / Query Builder  │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Response Builder (JSON Envelope / HTML / SSR)│
  │  + Audit Logger + Compression                │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
              Client Response
         (Secure, Typed, Compressed)
```

---

## 📦 Monorepo Packages

GAO Framework uses a monorepo managed by **Turborepo** and **pnpm**.

| Package | Description | Status |
|---------|-------------|--------|
| `@gao/core` | **Core Engine.** DI Container, Config Loader (Zod), Radix Router, Logger (Pino), Cache, Event System, Plugin System. | ✅ |
| `@gao/security` | **Security Fortress.** Helmet, CORS, CSRF, Rate Limiter, DDoS Shield, JWT (jose), RBAC, AES-256-GCM, Argon2id, Zod Validator, File Upload Guard, XSS Guard, CAPTCHA. | ✅ |
| `@gao/orm` | **Data Layer.** Type-safe Query Builder, Drivers (PostgreSQL, MySQL, MariaDB, SQLite), Migrations, BaseModel, Relations, Hooks, Field-level Encryption. | ✅ |
| `@gao/http` | **HTTP Layer.** Request/Response pipeline, Decorators (`@Controller`, `@Get`, `@Post`), Middleware, Compression, Cookies, Static File Serving, Debug Toolbar. | ✅ |
| `@gao/cli` | **Developer Tools.** Project scaffolding (`gao new`), code generation (`gao generate`), dev server, migration runner, seeder. | ✅ |
| `@gao/testing` | **Testing Utilities.** `createTestApp()` factory, `MockRequestBuilder`, `MockDatabase` (in-memory SQLite), `expectResponse()` fluent assertions. | ✅ |
| `@gao/view` | **View Engine.** `.gao` template engine with compiled functions, auto-escaping, layouts, sections, partials, component system, asset pipeline, built-in helpers. | ✅ |
| `@gao/desktop` | **Desktop Wrapper.** Tauri v2 config generator, type-safe IPC bridge, build pipeline, auto-updater. | ✅ |
| `@gao/mobile` | **Mobile Wrapper.** Capacitor config generator, native plugin bridge (Camera, Geolocation, Share), build pipeline, platform detection. | ✅ |
| `@gao/queue` | **Background Jobs.** BullMQ-powered job queue with named queues, retries, exponential backoff, cron/repeatable scheduling, and worker management. | ✅ |
| `@gao/email` | **Transactional Email.** Nodemailer transport with SMTP/Ethereal, HTML template engine with XSS escaping, built-in templates, and optional queue integration. | ✅ |
| `@gao/websocket` | **Real-Time.** Socket.IO with JWT authentication middleware, channel/room management, presence tracking, and helper utilities (emitToUser, emitToChannel, broadcast). | ✅ |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Bun 1.2+ (Node.js 22+ LTS fallback) |
| **Language** | TypeScript 5.7+ (Strict Mode, `noImplicitAny`) |
| **Validation** | Zod |
| **Logging** | Pino (structured JSON, auto-redaction) |
| **Testing** | Vitest |
| **Linter/Formatter** | Biome |
| **Security** | Native `crypto` (AES-256-GCM), Argon2, Jose (JWT) |
| **Desktop** | Tauri v2 |
| **Mobile** | Capacitor 6 |
| **Monorepo** | Turborepo + pnpm workspaces |

---

## 🚀 Getting Started

### Installation

```bash
# 1. Install the GAO CLI globally
pnpm add -g @gao/cli

# 2. Create a new project
gao new my-project
cd my-project

# 3. Start the development server
gao dev
```

### Configuration

New projects use `gao.config.ts` instead of `.env` files. All configuration is **type-safe** and **validated at boot time**:

```typescript
import { defineConfig } from '@gao/core';

export default defineConfig({
  app: {
    name: 'My Application',
    port: 3000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    driver: 'postgres',
    url: process.env.DATABASE_URL,
  },
  security: {
    cors: { origins: ['https://myapp.com'] }, // Must be explicit — no wildcards in production
    csrf: { enabled: true },
  },
});
```

### Creating an API

Use the decorator-based API to define routes:

```typescript
import { Controller, Get, Post, Validate, Guard } from '@gao/http';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

@Controller('/api/users')
export class UserController {

  @Get('/')
  @Guard('authenticated')
  async list(req: GaoRequest, res: GaoResponse) {
    const users = await User.query().paginate(req.query.page, 20);
    return res.json(users);
  }

  @Post('/')
  @Guard('admin')
  @Validate(CreateUserSchema)
  async create(req: GaoRequest, res: GaoResponse) {
    const user = await User.create(req.body);
    return res.status(201).json(user);
  }
}
```

### Server-Side Rendering

Render views with the built-in `.gao` template engine:

```typescript
@Get('/profile')
@Guard('authenticated')
async profile(req: GaoRequest, res: GaoResponse) {
  const user = await User.findOrFail(req.params.id);
  return res.render('users/profile', { user });
}
```

```html
<!-- views/users/profile.gao -->
<@ layout('master') @>

<@ section('content') @>
  <h1>Welcome, ${user.name}</h1>
  <p>Email: ${user.email}</p>
<@ endsection() @>
```

### Building for Multiple Platforms

```bash
# Build for web
gao build web

# Build for desktop (Windows / Linux / macOS)
gao build desktop

# Build for mobile
gao build android
gao build ios
```

---

## 🧪 Testing

GAO provides dedicated testing utilities for fast, isolated tests:

```typescript
import { createTestApp, MockRequestBuilder, expectResponse } from '@gao/testing';

const app = await createTestApp();

const req = new MockRequestBuilder()
  .method('GET')
  .url('/api/users')
  .header('Authorization', 'Bearer test-token')
  .build();

const response = await app.handle(req);

expectResponse(response)
  .status(200)
  .isJson()
  .hasProperty('data');
```

Run tests across the entire monorepo:

```bash
pnpm test          # Run all tests
pnpm build         # Build all packages
pnpm lint          # Lint all packages
```

---

## 🛡️ Vibe-Coding Safe

GAO Framework systematically prevents common vulnerabilities introduced by AI code generators:

| AI Mistake | Framework Prevention |
|------------|---------------------|
| Forgets input validation | **Impossible** — `@Validate(schema)` is required; without it, `req.body` is typed as `never`. |
| Uses string concatenation for SQL | **Impossible** — Query Builder has no raw SQL method; TypeScript compiler rejects it. |
| Forgets authentication | `@Guard()` decorator enforces access control; unguarded routes are logged as warnings at startup. |
| Hardcodes secrets | Config loader validates env vars with Zod at startup; missing config = crash immediately. |
| Uses `any` type | `tsconfig.json` has `strict: true` + `noImplicitAny: true`; compiler rejects. |
| Forgets error handling | Global error handler catches all unhandled errors with correlation IDs. |
| Creates SQL injection | All queries are parameterized by the Query Builder; no string interpolation path exists. |
| Forgets CSRF/CORS | Both are middleware that run by default; cannot be disabled without explicit config. |
| Installs malicious package | Dependency allowlist in `gao.config.ts` (optional but recommended). |
| Allows huge uploads | Body size limit (1MB default) + file upload MIME validation active by default. |
| Forgets compression | Response compression (Gzip/Brotli) enabled by default. |
| Writes XSS-vulnerable views | Template engine auto-escapes ALL output; raw output requires explicit `!{raw}` syntax. |
| Uses .env for secrets | Framework has **no** .env loader; config lives exclusively in `gao.config.ts`. |
| Forgets DDoS protection | DDoS Shield middleware active by default with sane limits. |

---

## 📊 Project Structure

```
gao-framework/
├── packages/
│   ├── core/           # @gao/core      — DI, Config, Router, Logger, Events, Cache
│   ├── security/       # @gao/security   — Full security middleware suite
│   ├── orm/            # @gao/orm        — Query Builder, Models, Migrations
│   ├── http/           # @gao/http       — Server, Controllers, Decorators
│   ├── cli/            # @gao/cli        — Code generation & dev tools
│   ├── testing/        # @gao/testing    — Test utilities & mocks
│   ├── view/           # @gao/view       — Template engine & SSR
│   ├── desktop/        # @gao/desktop    — Tauri v2 integration
│   └── mobile/         # @gao/mobile     — Capacitor integration
├── examples/
│   └── basic-api/      # Example application
├── docs/               # Documentation
├── turbo.json          # Turborepo config
├── package.json        # Root workspace
└── tsconfig.base.json  # Shared TypeScript config
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct, development workflow, and how to submit pull requests.

## 🔒 Security

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

---

## 📝 License

MIT License — GAO Framework Team.
