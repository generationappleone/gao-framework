<div align="center">

# 🚀 GAO Framework

**The Next-Generation TypeScript Full-Stack Multi-Platform Framework**

*v0.6.0 — Security-by-Default • High Performance • E2EE Transport • Zero External Dependencies UI Kit*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2+-black?logo=bun&logoColor=white)](https://bun.sh/)
[![Security](https://img.shields.io/badge/Security-Strict-red?logo=shield&logoColor=white)](#-1-security-by-default)
[![Monorepo](https://img.shields.io/badge/Monorepo-Turborepo-orange?logo=vercel&logoColor=white)](#-monorepo-packages--17-packages)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop%20%7C%20Mobile-green?logo=electron&logoColor=white)](#-4-multi-platform-build)
[![Tests](https://img.shields.io/badge/Tests-556%2B%20passing-brightgreen?logo=vitest&logoColor=white)](#-testing)

</div>

---

## 🌟 Overview

**GAO Framework** is a full-stack TypeScript framework purpose-built for the era of *AI-Assisted Development* (*vibe coding*). It enforces **Security-by-Default** policies at every layer, ensuring that applications — even those with AI-generated code — are always production-safe.

GAO runs on **[Bun](https://bun.sh/)** (with Node.js 22+ LTS fallback) and follows a strict **Convention-over-Configuration** philosophy so developers can focus on business logic instead of wrestling with boilerplate and config files.

### Why GAO?

| Principle | Description |
|-----------|-------------|
| **AI-Proof by Design** | Strict types, parameterized queries, and mandatory validation make it impossible for AI to introduce common vulnerabilities. |
| **One Codebase, Three Platforms** | Write once, deploy to Web (SSR/API), Desktop (Tauri v2), and Mobile (Capacitor). |
| **Zero .env Files** | All configuration lives in type-safe `gao.config.ts` validated by Zod at startup. Missing config = crash immediately. |
| **Enterprise Security** | CSRF, CORS, Rate Limiting, DDoS Shield, Helmet, XSS Guard, AES-256-GCM, Argon2id hashing, JWT — all active by default. |
| **Zero External UI Deps** | Built-in font system (10 families), icon library (200 SVG icons), and admin template. No Google Fonts, no Font Awesome, no Bootstrap. |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Bun 1.2+ (Node.js 22+ LTS fallback) |
| **Language** | TypeScript 5.7+ (Strict Mode, `noImplicitAny`) |
| **Validation** | Zod |
| **Logging** | Pino (structured JSON, auto-redaction) |
| **Testing** | Vitest (556+ tests passing) |
| **Linter/Formatter** | Biome |
| **Security** | Native `crypto` (AES-256-GCM), Argon2, Jose (JWT) |
| **Queue** | BullMQ (Redis-backed) |
| **Email** | Nodemailer (SMTP/Ethereal) |
| **WebSocket** | Socket.IO (with JWT auth) |
| **Desktop** | Tauri v2 |
| **Mobile** | Capacitor 6 |
| **Monorepo** | Turborepo + pnpm workspaces |

---

## 📦 Monorepo Packages — 17 Packages

GAO Framework uses a monorepo managed by **Turborepo** and **pnpm**.

| Package | Description | Deps |
|---------|-------------|------|
| `@gao/core` | **Core Engine.** DI Container (`Container`, `ScopedContainer`), Config Loader (Zod), Radix Router, Logger (Pino), Cache (`MemoryCacheAdapter`, `LRUCacheAdapter`, `RedisCacheAdapter`), Event System, Plugin System, Object Pool, Budget System, Permission System, Plugin Marketplace, Worker Sandbox. | zod, pino |
| `@gao/security` | **Security Fortress.** Middleware: `helmet()`, `cors()`, `csrf()`, `rateLimiter()`, `ddosShield()`, `xssGuard()`, `secureUpload()`, `captchaShield()`. Crypto: `encrypt()`/`decrypt()` (AES-256-GCM), `hashPassword()`/`verifyPassword()` (Argon2id), `@Encrypted()` field decorator. Auth: `JwtService`, `RbacEngine`, `guard()`. | jose, argon2 |
| `@gao/orm` | **Data Layer.** Active Record (`Model.find()`, `.create()`, `.save()`, `.destroy()`), Query Builder (30+ methods: `whereIn`, `whereNull`, `whereBetween`, `groupBy`, `having`, `count`, `sum`, `pluck`, `exists`, `upsert`, `increment`), Schema Builder (`decimal`, `json`, `jsonb`, `enum`, `foreignKey`, `AlterTableBuilder`), Migration Engine (batch tracking, rollback, reset, refresh, status), Seeder, Model Hooks (`@BeforeSave`, `@AfterSave`). Drivers: PostgreSQL, MySQL, MariaDB, SQLite. | better-sqlite3, pg, mysql2 |
| `@gao/http` | **HTTP Layer.** Bun/Node dual server, Decorators (`@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`, `@Validate`, `@Guard`, `@UseMiddleware`), Session Management (Memory/Redis stores), Flash Messages, HTTP Exceptions (400-429), `createHttpHandler()` factory, Stream Parser, Debug Toolbar. | — |
| `@gao/view` | **View Engine.** `.gao` template engine: `${expr}` (auto-escaped), `!{expr}` (raw), `<@ code @>` (JS blocks). Directives: `@if`/`@elseif`/`@else`/`@endif`, `@foreach`/`@endforeach`, `@unless`, `@switch`/`@case`, `@empty`, `@json()`, `@class()`, `@fonts()`, `@icon()`, `@adminLayout()`. Layout inheritance, component system, asset pipeline, built-in helpers (`url`, `asset`, `csrf`, `can`, `old`, `paginate`). | — |
| `@gao/cli` | **Developer Tools.** `gao new`, `gao generate [controller\|model\|migration\|seeder\|view]`, `gao migrate [run\|rollback\|status\|refresh\|make]`, `gao seed [run\|fresh]`, `gao dev`, `gao build`. | commander |
| `@gao/testing` | **Testing Utilities.** `createTestApp()`, `MockRequestBuilder`, `MockDatabase` (in-memory SQLite), `expectResponse()` fluent assertions. | — |
| `@gao/queue` | **Background Jobs.** `QueueManager` (BullMQ), `GaoWorker`, `Scheduler` (cron/repeatable jobs). Named queues, retries, exponential backoff, job lifecycle logging. `queuePlugin()` for framework integration. | bullmq |
| `@gao/email` | **Transactional Email.** `Mailer` class (Nodemailer), SMTP/Ethereal transport, HTML template compiler (double-brace `{{var}}` interpolation with auto XSS escaping, `{{{raw}}}` for raw HTML), built-in templates (welcome, reset-password, verification). Optional queue integration. `emailPlugin()`. | nodemailer |
| `@gao/websocket` | **Real-Time.** `WebSocketServer` (Socket.IO wrapper), JWT auth middleware, `PresenceTracker` (multi-connection per user), `ChannelManager` (rooms with maxMembers, auto-cleanup), helpers: `emitToUser()`, `emitToChannel()`, `broadcast()`. `websocketPlugin()`. | socket.io |
| `@gao/ui` | **UI Kit.** GaoType (10 font families), GaoIcons (200 dual-tone SVG icons in 10 categories), GaoAdmin (glassmorphism admin template with 14 components, SVG charts, dark/light mode). `gaoUIPlugin()` for view engine integration. **Zero external dependencies.** | — |
| `@gao/monitor` | **Monitoring.** `MetricsCollector` (counter/gauge/histogram), `toPrometheus()` export, `SystemMonitor` (CPU/memory/event loop lag), `RingBuffer` for bounded metric storage. | — |
| `@gao/desktop` | **Desktop Wrapper.** Tauri v2 config generator, type-safe IPC bridge, build pipeline, auto-updater. | — |
| `@gao/mobile` | **Mobile Wrapper.** Capacitor config generator, native plugin bridge (Camera, Geolocation, Share), build pipeline, platform detection. | — |
| `@gao/crypto-transport` | **E2EE Transport Layer.** Transparent end-to-end encryption: X25519 ECDH handshake, AES-256-GCM envelope encryption, HKDF-SHA256 key derivation, forward-secrecy key ratchet, replay protection (monotonic seq), auto-decrypt/auto-encrypt middleware, browser client SDK (Web Crypto API), Redis session store with atomic INCR. | — |
| `@gao/antivirus` | **Upload Virus Scanner.** Mandatory file upload scanning: ClamAV daemon integration (TCP/Unix socket), NoopScanner (dev), MultiScanner (parallel), QuarantineManager (file isolation + JSON audit log), `scanFile()` with fallback modes (strict/warn/allow), oversized file rejection, SHA-256 audit trail. | clamscan (optional) |
| `@gao/mesh` | **Encrypted Mesh Network.** Overlay mesh for inter-service communication: ChaCha20-Poly1305 AEAD transport, binary wire format, PeerManager (heartbeat, dead peer detection, key lifecycle), topic-based message routing with wildcards, pluggable DiscoveryProvider (static built-in), key wiping on disconnect. | — |

---

## 🏗 Architecture

### Request Lifecycle Pipeline

```text
Client Request (encrypted if E2EE active)
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Bun Server (Node.js fallback)                  │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  E2EE Pipeline (@gao/crypto-transport)        │
  │  Handshake → Auto-Decrypt → [process]        │
  │  → Auto-Encrypt (if session active)          │
  └──────────────────┬───────────────────────────┘
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
  │  Body Parser → Session → Flash              │
  │  File Uploads → Antivirus Scan (@gao/antivirus)
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Router (Radix Tree — O(log n) matching)     │
  │  Route Params (:id), Wildcards (*)           │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Validation Layer (@Validate + Zod Schema)   │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Guard Layer (@Guard — RBAC / JWT check)     │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Controller → Service → ORM / Query Builder  │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  Response (JSON / HTML SSR / Redirect)       │
  │  + Compression (Gzip/Brotli)                 │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
              Client Response
```

### Plugin System

GAO uses a **lifecycle-based plugin system** with three hooks:

```typescript
interface Plugin {
  name: string;
  version: string;
  onRegister(app: GaoApp): void;     // Register services in DI container
  onBoot(app: GaoApp): Promise<void>; // Initialize after all plugins registered
  onShutdown?(app: GaoApp): Promise<void>; // Graceful cleanup
}
```

Built-in plugins: `queuePlugin()`, `emailPlugin()`, `websocketPlugin()`, `gaoUIPlugin()`.

### Dependency Injection

```typescript
import { Container, Inject, Injectable } from '@gao/core';

@Injectable()
class UserService {
  constructor(
    @Inject('db') private db: Database,
    @Inject('logger') private logger: Logger,
  ) {}
}

const container = new Container();
container.singleton('db', () => new Database());
container.singleton('logger', () => createLogger());
container.autoRegister(UserService);

const userService = container.resolveClass(UserService);
```

**Container features:**
- `singleton(token, factory)` — Single instance
- `transient(token, factory)` — New instance per resolve
- `instance(token, value)` — Pre-created value
- `resolveClass(Class)` — Auto-inject via `@Inject()` decorators
- Circular dependency detection
- `ScopedContainer` — Permission-restricted container for plugin isolation

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

### Configuration — `gao.config.ts`

GAO uses **type-safe configuration** instead of `.env` files. All config is validated by Zod at boot time:

```typescript
// gao.config.ts
import { defineConfig } from '@gao/core';

export default defineConfig({
  app: {
    name: 'My Application',
    port: 3000,
    environment: 'development', // 'development' | 'staging' | 'production' | 'test'
    debug: true,
  },

  // Database (uses process.env for secrets — NOT .env files)
  database: {
    driver: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    database: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },

  // Security (all enabled by default)
  security: {
    cors: { origins: ['https://myapp.com'] },
    csrf: { enabled: true },
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  },

  // Queue (optional — needs Redis)
  queue: {
    enabled: true,
    redis: { host: 'localhost', port: 6379 },
  },

  // Email (optional)
  email: {
    from: { name: 'MyApp', address: 'noreply@myapp.com' },
    transport: 'smtp',
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
  },

  // WebSocket (optional)
  websocket: {
    enabled: true,
    path: '/ws',
    cors: { origins: ['http://localhost:3000'] },
  },
});
```

**Environment-specific overrides:** Create `gao.config.production.ts` — it deep-merges with the base config when `NODE_ENV=production`.

---

## 📝 Code Examples

### 1. REST API Controller

```typescript
import { Controller, Get, Post, Put, Delete, Validate, Guard, UseMiddleware } from '@gao/http';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

const UpdateUserSchema = CreateUserSchema.partial();

@Controller('/api/users')
export class UserController {

  @Get('/')
  @Guard('authenticated')
  async list(req: GaoRequest, res: GaoResponse) {
    const users = await User.query()
      .where('active', '=', true)
      .orderBy('created_at', 'desc')
      .paginate(req.query.page ?? 1, 20);
    return res.json(users);
  }

  @Get('/:id')
  @Guard('authenticated')
  async show(req: GaoRequest, res: GaoResponse) {
    const user = await User.findOrFail(req.params.id);
    return res.json({ data: user });
  }

  @Post('/')
  @Guard('admin')
  @Validate(CreateUserSchema)
  async create(req: GaoRequest, res: GaoResponse) {
    const data = req.validated<z.infer<typeof CreateUserSchema>>();
    const user = await User.create(data);
    return res.status(201).json({ data: user });
  }

  @Put('/:id')
  @Guard('admin')
  @Validate(UpdateUserSchema)
  async update(req: GaoRequest, res: GaoResponse) {
    const user = await User.findOrFail(req.params.id);
    Object.assign(user, req.validated());
    await user.save();
    return res.json({ data: user });
  }

  @Delete('/:id')
  @Guard('admin')
  async destroy(req: GaoRequest, res: GaoResponse) {
    const user = await User.findOrFail(req.params.id);
    await user.destroy(); // Soft delete by default
    return res.status(204).json(null);
  }
}
```

### 2. Application Bootstrap

```typescript
// app.ts
import { createApp } from '@gao/core';
import { createHttpHandler, bodyParserMiddleware, sessionMiddleware } from '@gao/http';
import { queuePlugin } from '@gao/queue';
import { emailPlugin } from '@gao/email';
import { websocketPlugin } from '@gao/websocket';
import { gaoUIPlugin } from '@gao/ui';
import { UserController } from './controllers/user.controller.js';

const app = await createApp();

// Register plugins
app.register(queuePlugin());
app.register(emailPlugin());
app.register(websocketPlugin());
app.register(gaoUIPlugin({ fonts: true, icons: true, admin: true }));

// Boot all plugins
await app.boot();

// Create HTTP handler
const handler = createHttpHandler({
  controllers: [UserController],
  container: app.container,
  middlewares: [
    bodyParserMiddleware(),
    sessionMiddleware({ store: 'memory', secret: process.env.SESSION_SECRET }),
  ],
});

// Start server
app.listen(handler);
```

### 3. ORM — Active Record & Query Builder

```typescript
import { Model, BeforeSave, AfterSave, Encrypted } from '@gao/orm';

class User extends Model {
  static table = 'users';
  static softDeletes = true;

  @Encrypted()      // Transparently encrypted at rest
  ssn!: string;

  @BeforeSave()
  normalizeEmail() {
    this.email = this.email.toLowerCase().trim();
  }

  @AfterSave()
  async sendWelcome() {
    if (this.wasRecentlyCreated) {
      await mailer.send({ to: this.email, template: 'welcome' });
    }
  }
}

// Active Record API
const user = await User.find(1);
const user = await User.findOrFail(1);           // Throws NotFoundError
const users = await User.all();
const admins = await User.where('role', '=', 'admin').get();
const user = await User.create({ name: 'Alice', email: 'alice@example.com' });

// Query Builder (30+ methods)
const results = await User.query()
  .select('id', 'name', 'email')
  .where('active', '=', true)
  .whereNotNull('email_verified_at')
  .whereIn('role', ['admin', 'moderator'])
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// Aggregations
const count = await User.query().where('active', '=', true).count();
const total = await Order.query().where('status', '=', 'paid').sum('total');

// Eager loading (prevent N+1)
const users = await User.with('posts', 'profile').get();

// Upsert
await User.query().upsert(
  { email: 'alice@example.com', name: 'Alice Updated' },
  ['email'],  // conflict columns
);

// Pagination
const paginated = await User.query().paginate(page, perPage);
// Returns: { data: User[], meta: { page, perPage, total, totalPages, hasNext, hasPrev } }
```

### 4. Database Migrations & Schema

```typescript
// migrations/2026_02_27_create_users_table.ts
import { Schema } from '@gao/orm';

export async function up() {
  await Schema.create('users', (table) => {
    table.uuid('id').primary();
    table.string('name', 100).notNull();
    table.string('email', 255).notNull().unique();
    table.string('password', 255).notNull();
    table.enum('role', ['user', 'admin', 'moderator']).default("'user'");
    table.json('metadata').nullable();
    table.timestamp('email_verified_at').nullable();
    table.timestamps();           // created_at + updated_at
    table.timestamp('deleted_at').nullable(); // Soft delete
    table.index(['email']);
    table.index(['role', 'active']);
  });
}

export async function down() {
  await Schema.dropIfExists('users');
}

// ALTER TABLE support
export async function up() {
  await Schema.alter('users', (table) => {
    table.addColumn('phone', 'varchar(20)').nullable();
    table.addColumn('avatar_url', 'text').nullable();
    table.addForeignKey('team_id', 'teams', 'id', 'SET NULL');
  });
}
```

**CLI Migration Commands:**
```bash
gao migrate run              # Apply pending migrations
gao migrate rollback         # Rollback last batch
gao migrate rollback 3       # Rollback last 3 batches  
gao migrate status           # Show migration status
gao migrate refresh          # Rollback all + re-apply
gao migrate make create_posts_table  # Generate migration file
gao seed run                 # Run all seeders
gao seed fresh               # Refresh + seed
```

### 5. View Engine (`.gao` Templates)

```html
<!-- views/layouts/master.gao -->
<!DOCTYPE html>
<html>
<head>
  <title>${title || 'My App'}</title>
  !{injectFonts(['GaoSans', 'GaoMono'])}
  !{adminCSS()}
</head>
<body>
  <@ yieldSection('content') @>
  !{adminScripts()}
</body>
</html>
```

```html
<!-- views/users/profile.gao -->
<@ layout('layouts/master') @>

<@ section('content') @>
  <h1>Welcome, ${user.name}</h1>
  <p>Email: ${user.email}</p>

  @if(user.posts.length > 0)
    <h2>Posts (${user.posts.length})</h2>
    @foreach(user.posts as post, idx)
      <article class="@class({ 'bg-alt': idx % 2 === 0 })">
        <h3>!{gaoIcon('file-text', { size: 16 })} ${post.title}</h3>
        <p>${post.body}</p>
      </article>
    @endforeach
  @else
    <p>No posts yet.</p>
  @endif

  @unless(user.isAdmin)
    <p>Contact admin for elevated permissions.</p>
  @endunless
<@ endsection() @>
```

**Template Syntax Reference:**

| Syntax | Description | XSS Safe? |
|--------|-------------|-----------|
| `${expr}` | Escaped output | ✅ Auto-escaped |
| `!{expr}` | Raw HTML output | ⚠️ No escaping |
| `<@ code @>` | JavaScript block | N/A |
| `@if(cond)` / `@endif` | Conditional | N/A |
| `@foreach(arr as item)` / `@endforeach` | Loop | N/A |
| `@foreach(arr as item, idx)` | Loop with index | N/A |
| `@unless(cond)` / `@endunless` | Negated conditional | N/A |
| `@switch(expr)` / `@case(val)` / `@endswitch` | Switch | N/A |
| `@empty(array)` / `@endempty` | Empty array check | N/A |
| `@json(data)` | JSON output (escaped) | ✅ |
| `@class({ 'name': cond })` | Conditional CSS classes | N/A |
| `@fonts(['GaoSans'])` | Inject font CSS (requires `gaoUIPlugin`) | ✅ |
| `@icon('name', opts)` | Render SVG icon (requires `gaoUIPlugin`) | ✅ |
| `@adminLayout(config)` | Full admin layout (requires `gaoUIPlugin`) | ✅ |

### 6. Security

```typescript
import { encrypt, decrypt, hashPassword, verifyPassword, JwtService } from '@gao/security';

// AES-256-GCM Encryption
const encrypted = encrypt('sensitive data', process.env.ENCRYPTION_KEY);
const decrypted = decrypt(encrypted, process.env.ENCRYPTION_KEY);

// Argon2id Password Hashing
const hash = await hashPassword('user-password');
const valid = await verifyPassword('user-password', hash);

// JWT Authentication
const jwt = new JwtService({
  secret: process.env.JWT_SECRET,
  accessTokenTtl: '15m',
  refreshTokenTtl: '7d',
});

const tokens = await jwt.generateTokens({ sub: user.id, role: user.role });
// → { accessToken: '...', refreshToken: '...' }

const payload = await jwt.verifyAccessToken(tokens.accessToken);
// → { sub: 'user-id', role: 'admin', iat: ..., exp: ... }

// Field-Level Encryption (transparent in ORM)
class User extends Model {
  @Encrypted()  ssn!: string;          // Encrypted at rest, decrypted on read
  @Encrypted()  bankAccount!: string;
}

// RBAC
const rbac = new RbacEngine({
  roles: {
    admin: { permissions: ['users:*', 'posts:*'] },
    editor: { permissions: ['posts:create', 'posts:edit'], inherits: ['viewer'] },
    viewer: { permissions: ['posts:read'] },
  },
});

rbac.can('editor', 'posts:edit');  // true
rbac.can('viewer', 'posts:edit');  // false
```

### 7. Background Jobs & Queue

```typescript
import { QueueManager, GaoWorker, Scheduler } from '@gao/queue';

// Create a queue manager
const queueManager = new QueueManager({
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
}, logger);

// Add a job
await queueManager.addJob('email', 'send-welcome', {
  to: 'user@example.com',
  template: 'welcome',
});

// Process jobs
const worker = new GaoWorker('email', async (job) => {
  await mailer.send(job.data);
}, { connection: { host: 'localhost', port: 6379 } }, logger);

// Schedule recurring jobs
const scheduler = new Scheduler(queueManager, logger);
scheduler.registerCron('cleanup', 'maintenance', { task: 'cleanup-expired' }, '0 2 * * *');
scheduler.registerInterval('heartbeat', 'monitoring', { check: 'health' }, 30000);
```

### 8. Email

```typescript
import { Mailer } from '@gao/email';

const mailer = new Mailer({
  from: { name: 'MyApp', address: 'noreply@myapp.com' },
  transport: 'smtp',
  smtp: { host: 'smtp.gmail.com', port: 587, auth: { user: '...', pass: '...' } },
}, logger);

await mailer.init();

// Send with built-in template
await mailer.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  variables: { name: 'Alice', appName: 'MyApp' },
});

// Send raw HTML
await mailer.send({
  to: 'user@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thank you for your order!</h1>',
});
```

### 9. WebSocket (Real-Time)

```typescript
import { WebSocketServer } from '@gao/websocket';

const ws = new WebSocketServer({
  enabled: true,
  path: '/ws',
  cors: { origins: ['http://localhost:3000'] },
}, logger);

// Attach to HTTP server with JWT auth
ws.attach(httpServer, async (token) => {
  const payload = await jwt.verifyAccessToken(token);
  return payload ? { id: payload.sub } : null;
});

// Emit to specific user (across all their connections)
ws.emitToUser('user-123', 'notification', { message: 'New comment on your post' });

// Emit to channel/room
ws.emitToChannel('chat:general', 'message', { from: 'Alice', text: 'Hello!' });

// Broadcast to everyone
ws.broadcast('announcement', { text: 'Server will restart in 5 minutes' });

// Presence tracking
const online = ws.getPresence().getOnlineUsers(); // ['user-1', 'user-2', ...]
const isOnline = ws.getPresence().isOnline('user-123'); // true/false
```

### 10. UI Kit — Fonts, Icons, Admin

```typescript
import { gaoIcon, injectFonts, createAdminTemplate, statCard, dataTable } from '@gao/ui';

// ─── Level 1: INSTANT (one-liner admin page) ─────────────────
const html = createAdminTemplate.layout({
  title: 'Dashboard',
  sidebar: [
    { label: 'Dashboard', icon: 'home', href: '/', active: true },
    { label: 'Users', icon: 'users', href: '/users' },
    { label: 'Settings', icon: 'settings', href: '/settings' },
  ],
  user: { name: 'Admin', email: 'admin@example.com' },
  content: '<h1>Welcome to Dashboard</h1>',
});
// Returns: Complete HTML page with sidebar, navbar, glassmorphism CSS, dark mode, icons

// ─── Level 2: TEMPLATE (use in .gao templates) ───────────────
// In your .gao template:
// @fonts(['GaoSans', 'GaoMono'])
// @icon('home', { size: 20 })
// !{statCard({ icon: 'users', value: '1,234', label: 'Total Users', trend: '+12%' })}

// ─── Level 3: ALA CARTE (individual imports) ──────────────────
const icon = gaoIcon('edit', { size: 16, color: '#3b82f6' });
const fonts = injectFonts(['GaoSans', 'GaoMono']); // Returns <style>@font-face{...}</style>
const card = statCard({ icon: 'users', value: '1,234', label: 'Total Users', trend: '+12%' });
const table = dataTable({
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ],
  rows: [
    { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { name: 'Bob', email: 'bob@example.com', role: 'User' },
  ],
});
```

**Available Icons (200 total):**

| Category | Icons |
|----------|-------|
| **Navigation** (20) | `home`, `menu`, `arrow-up/down/left/right`, `chevron-*`, `external-link`, `maximize`, `minimize`, `sidebar`, `layout`, `grid-layout` |
| **Actions** (20) | `edit`, `delete`, `trash`, `save`, `copy`, `paste`, `cut`, `download`, `upload`, `refresh`, `search`, `zoom-in/out`, `plus`, `minus`, `check`, `x`, `undo`, `redo`, `print` |
| **Media** (20) | `play`, `pause`, `stop`, `skip-*`, `volume`, `image`, `video`, `music`, `camera`, `mic`, `film`, `headphones`, `speaker`, `tv` |
| **Social** (20) | `heart`, `star`, `bookmark`, `share`, `comment`, `thumbs-up/down`, `bell`, `flag`, `pin`, `send`, `at-sign`, `hash`, `link`, `users`, `user-plus` |
| **Data** (20) | `chart-bar/line/pie/area`, `database`, `filter`, `sort-*`, `layers`, `list`, `table`, `columns`, `inbox`, `archive`, `folder`, `file`, `clipboard` |
| **Status** (20) | `check-circle`, `x-circle`, `alert-triangle/circle`, `info`, `help-circle`, `clock`, `shield`, `lock`, `unlock`, `eye`, `loader`, `zap`, `activity`, `trending-up` |
| **Commerce** (20) | `cart`, `wallet`, `credit-card`, `receipt`, `tag`, `percent`, `gift`, `truck`, `store`, `dollar`, `euro`, `barcode`, `qr-code`, `package`, `box` |
| **Device** (20) | `phone`, `laptop`, `monitor`, `tablet`, `printer`, `keyboard`, `mouse`, `wifi`, `bluetooth`, `battery`, `cpu`, `hard-drive`, `server`, `cloud` |
| **Nature** (20) | `sun`, `moon`, `cloud-sun`, `rain`, `snow`, `wind`, `leaf`, `tree`, `flame`, `water`, `mountain`, `sunrise`, `thermometer`, `umbrella`, `lightning` |
| **Misc** (20) | `rocket`, `magic-wand`, `crown`, `diamond`, `key`, `compass`, `globe`, `map`, `code`, `terminal`, `git-branch`, `puzzle`, `light-bulb`, `trophy`, `target`, `crosshair` |

---

## 🧪 Testing

GAO provides dedicated testing utilities for fast, isolated tests:

```typescript
import { createTestApp, MockRequestBuilder, expectResponse } from '@gao/testing';

const app = await createTestApp();

const req = new MockRequestBuilder()
  .method('POST')
  .url('/api/users')
  .header('Authorization', 'Bearer test-token')
  .body({ name: 'Alice', email: 'alice@example.com' })
  .build();

const response = await app.handle(req);

expectResponse(response)
  .status(201)
  .isJson()
  .hasProperty('data')
  .hasProperty('data.id');
```

**Run commands:**
```bash
pnpm test          # Run all tests (556+ tests across 75+ test files)
pnpm build         # Build all 14 packages
pnpm lint          # Lint entire codebase
```

**Current test counts:**

| Package | Tests |
|---------|-------|
| `@gao/core` | 115 |
| `@gao/security` | 72 |
| `@gao/http` | 65 |
| `@gao/orm` | — |
| `@gao/view` | 51 |
| `@gao/ui` | 68 |
| `@gao/monitor` | 25 |
| `@gao/queue` | 20 |
| `@gao/email` | 18 |
| `@gao/websocket` | 22 |
| `@gao/crypto-transport` | 61 |
| `@gao/antivirus` | 16 |
| `@gao/mesh` | 23 |

---

## 🛡️ Vibe-Coding Safe

GAO Framework systematically prevents common vulnerabilities introduced by AI code generators:

| AI Mistake | Framework Prevention |
|------------|---------------------|
| Forgets input validation | `@Validate(schema)` is required; without it, `req.body` is typed as `never`. |
| Uses string concatenation for SQL | Query Builder has no raw SQL method; TypeScript compiler rejects it. |
| Forgets authentication | `@Guard()` decorator enforces access; unguarded routes are logged as warnings. |
| Hardcodes secrets | Config loader validates env vars with Zod at boot; missing = crash immediately. |
| Uses `any` type | `tsconfig.json` has `strict: true` + `noImplicitAny: true`. |
| Forgets error handling | Global error handler catches all unhandled errors with correlation IDs. |
| Creates SQL injection | All queries are parameterized. No string interpolation path exists. |
| Forgets CSRF/CORS | Both are middleware that run by default; cannot be disabled without explicit config. |
| Allows huge uploads | Body size limit (1MB default) + file upload MIME validation active by default. |
| Writes XSS-vulnerable views | Template engine auto-escapes ALL `${expr}` output; raw requires explicit `!{raw}`. |
| Uses .env for secrets | Framework has **no** .env loader. Config lives exclusively in `gao.config.ts`. |
| Forgets DDoS protection | DDoS Shield middleware active by default with sane limits. |
| Installs malicious package | `@gao/ui` needs **zero** external deps. Other packages have minimal, vetted deps. |
| Sends data in plaintext | `@gao/crypto-transport` provides transparent E2EE — X25519 ECDH + AES-256-GCM encryption. Client and server code sees plaintext; wire is always encrypted. |
| Skips virus scanning on uploads | `@gao/antivirus` enforces mandatory scanning in `strict` mode. Oversized files are **rejected**, not silently passed. |
| Uses plaintext inter-service calls | `@gao/mesh` encrypts all inter-node traffic with ChaCha20-Poly1305 AEAD. Session keys wiped on disconnect. |

---

## 🏢 Efficiency & Isolation (v0.4.0)

### Object Pool
```typescript
import { ObjectPool } from '@gao/core';

const pool = new ObjectPool<Buffer>({
  create: () => Buffer.alloc(4096),
  reset: (buf) => buf.fill(0),
  max: 100,
  preWarm: 10,
});

const buf = pool.acquire();
// ... use buf ...
pool.release(buf);

console.log(pool.stats()); // { size: 100, available: 99, hitRatio: 0.98 }
```

### Budget System
```typescript
import { runWithBudget, BUDGET_PLANS, trackDbQuery } from '@gao/core';

// Enforce resource limits per request
await runWithBudget(BUDGET_PLANS.free, async () => {
  // Max 50 DB queries, 100ms CPU, 1MB response
  trackDbQuery(); // Throws BudgetExceededError if limit hit
  const users = await User.all();
  return res.json(users);
});
```

### Permission System
```typescript
import { ScopedContainer, PermissionSet } from '@gao/core';

const scoped = new ScopedContainer(container, new PermissionSet([
  'db:read',
  'net:fetch:api.example.com',
]));

scoped.resolve('db');     // ✅ Allowed (has db:read)
scoped.resolve('mailer'); // ❌ Throws — no net:smtp permission
```

---

## 📊 Project Structure

```
gao-framework/
├── packages/
│   ├── core/           # @gao/core       — DI, Config, Router, Logger, Events, Cache,
│   │                   #                    ObjectPool, LRU, Budget, Permissions, Plugins
│   ├── security/       # @gao/security    — CSRF, CORS, Helmet, Rate Limiter, DDoS,
│   │                   #                    XSS, JWT, RBAC, AES-256, Argon2id, Encryption
│   ├── orm/            # @gao/orm         — Active Record, Query Builder, Schema Builder,
│   │                   #                    Migrations, Seeds, Hooks, Relations, 4 DB drivers
│   ├── http/           # @gao/http        — Server, Controllers, Decorators, Session,
│   │                   #                    Flash, Middleware, Validation, Stream Parser
│   ├── view/           # @gao/view        — .gao Template Engine, Directives, Layouts,
│   │                   #                    Components, Asset Pipeline, UI Integration
│   ├── cli/            # @gao/cli         — gao new|generate|migrate|seed|dev|build
│   ├── testing/        # @gao/testing     — TestApp, MockRequest, MockDB, Assertions
│   ├── queue/          # @gao/queue       — BullMQ Queue, Worker, Scheduler, Plugin
│   ├── email/          # @gao/email       — Nodemailer, Templates, Queue Integration
│   ├── websocket/      # @gao/websocket   — Socket.IO, JWT Auth, Presence, Channels
│   ├── ui/             # @gao/ui          — 10 Fonts, 200 Icons, Admin Template, Plugin
│   ├── monitor/        # @gao/monitor     — Metrics, Prometheus, SystemMonitor
│   ├── desktop/        # @gao/desktop     — Tauri v2 integration
│   ├── mobile/         # @gao/mobile      — Capacitor integration
│   ├── crypto-transport/ # @gao/crypto-transport — E2EE: X25519, AES-256-GCM,
│   │                   #                    HKDF Ratchet, Replay Protection
│   ├── antivirus/      # @gao/antivirus   — ClamAV, MultiScanner, Quarantine
│   └── mesh/           # @gao/mesh        — ChaCha20-Poly1305, Peer Mgmt, Topics
├── turbo.json          # Turborepo pipeline config
├── package.json        # Root workspace (scripts: build, test, lint, clean)
├── tsconfig.base.json  # Shared TypeScript strict config
├── biome.json          # Linter/formatter config
└── pnpm-workspace.yaml # Workspace: packages/*
```

---

## 🔧 API Quick Reference

### `@gao/core`

| Export | Type | Description |
|--------|------|-------------|
| `createApp()` | Function | Bootstrap GAO application |
| `Container` | Class | DI container (singleton, transient, instance) |
| `ScopedContainer` | Class | Permission-restricted container |
| `Router` | Class | Radix-tree router with `:param` and `*` wildcards |
| `Logger` / `createLogger()` | Class | Pino-based structured logger |
| `EventEmitter` | Class | Typed event emitter (on, once, off, emit) |
| `CacheService` | Class | Cache abstraction (Memory, LRU, Redis adapters) |
| `loadConfig()` / `defineConfig()` | Function | Type-safe config loader with Zod validation |
| `ObjectPool<T>` | Class | Bounded object pool with pre-warming |
| `LRUCacheAdapter` | Class | Memory-bounded LRU cache |
| `PermissionSet` | Class | Deno-style permission declarations |
| `runWithBudget()` | Function | Resource budget enforcement |
| `PluginMarketplace` | Class | Plugin lifecycle orchestrator |
| `WorkerSandbox` | Class | Worker thread isolation |
| `@Inject()` / `@Injectable()` | Decorator | Constructor DI |

### `@gao/http`

| Export | Type | Description |
|--------|------|-------------|
| `@Controller(path)` | Decorator | Route prefix for class |
| `@Get(path)` / `@Post` / `@Put` / `@Delete` | Decorator | HTTP method handlers |
| `@Validate(zodSchema)` | Decorator | Auto-validate request body |
| `@Guard(type)` | Decorator | Auth/role guard |
| `@UseMiddleware(fn)` | Decorator | Per-route middleware |
| `createHttpHandler(config)` | Function | Wire controllers + middleware into handler |
| `bodyParserMiddleware()` | Function | Auto-parse JSON/form bodies |
| `sessionMiddleware(config)` | Function | Cookie-based sessions |
| `corsMiddleware(options)` | Function | CORS headers |
| `Session` | Class | Typed session store |
| `FlashMessages` | Class | One-time session data |

### `@gao/security`

| Export | Type | Description |
|--------|------|-------------|
| `helmet()` | Middleware | Security headers |
| `cors()` | Middleware | CORS with origin validation |
| `csrf()` | Middleware | CSRF token validation |
| `rateLimiter()` | Middleware | Rate limiting (sliding window) |
| `ddosShield()` | Middleware | DDoS protection |
| `xssGuard()` | Middleware | XSS prevention + CSP |
| `secureUpload()` | Middleware | File upload validation |
| `encrypt()` / `decrypt()` | Function | AES-256-GCM |
| `hashPassword()` / `verifyPassword()` | Function | Argon2id |
| `@Encrypted()` | Decorator | Field-level encryption |
| `JwtService` | Class | JWT token management |
| `RbacEngine` | Class | Role-based access control |

### `@gao/crypto-transport`

| Export | Type | Description |
|--------|------|-------------|
| `createE2EEPipeline(config)` | Function | Factory for complete E2EE pipeline (handshake + decrypt + encrypt) |
| `generateKeyPair()` | Function | Generate X25519 ECDH key pair |
| `deriveSharedKeys()` | Function | ECDH shared secret → HKDF → encryption + MAC keys |
| `encryptEnvelope()` / `decryptEnvelope()` | Function | AES-256-GCM envelope encrypt/decrypt with AAD |
| `MemorySessionStore` | Class | In-memory E2EE session store (dev) |
| `RedisSessionStore` | Class | Redis-backed session store with atomic INCR (prod) |
| `ratchetKey()` / `rotateSessionKey()` | Function | Forward-secrecy HKDF chain key rotation |
| `createAutoDecrypt()` / `createAutoEncrypt()` | Function | Transparent request/response middleware |
| `GaoE2EE` | Class | Browser client SDK (Web Crypto API) |

### `@gao/antivirus`

| Export | Type | Description |
|--------|------|-------------|
| `scanFile(file, config)` | Function | Core scan function (framework-agnostic) |
| `NoopScanner` | Class | Dev-only scanner (always clean) |
| `ClamAVScanner` | Class | ClamAV daemon integration (TCP/Unix) |
| `MultiScanner` | Class | Run multiple scanners in parallel |
| `QuarantineManager` | Class | Isolate infected files + JSON audit log |

### `@gao/mesh`

| Export | Type | Description |
|--------|------|-------------|
| `MeshNode` | Class | Core mesh node (topic routing + encrypted send) |
| `PeerManager` | Class | Peer lifecycle, heartbeat, dead peer detection |
| `StaticDiscovery` | Class | In-memory peer registry |
| `encryptMessage()` / `decryptMessage()` | Function | ChaCha20-Poly1305 AEAD encrypt/decrypt |
| `serializeWireMessage()` / `deserializeWireMessage()` | Function | Binary wire format conversion |

---

## 🌍 Multi-Platform Build

```bash
# Build for web (SSR + API)
gao build web

# Build for desktop (Windows / Linux / macOS via Tauri v2)
gao build desktop

# Build for mobile
gao build android     # APK / AAB
gao build ios         # App Store
```

Platform detection in code:
```typescript
import { Platform } from '@gao/core';

if (Platform.is('web'))     { /* server-side logic */ }
if (Platform.is('desktop')) { /* Tauri-specific logic */ }
if (Platform.is('mobile'))  { /* Capacitor-specific logic */ }
```

---

## 📋 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **0.6.0** | 2026-02-28 | `@gao/crypto-transport` (E2EE), `@gao/antivirus` (upload scanning), `@gao/mesh` (encrypted mesh) — 3 mandatory security layers, 100 new tests |
| **0.5.0** | 2026-02-27 | `@gao/ui` — 10 fonts, 200 icons, admin template, `gaoUIPlugin()` |
| **0.4.0** | 2026-02-27 | `@gao/monitor`, ObjectPool, LRU, Budget System, Permissions, Plugin Marketplace |
| **0.3.0** | 2026-02-27 | Middleware factories, `createHttpHandler()`, Redis adapters, CLI commands |
| **0.2.0** | 2026-02-27 | Active Record, Query Builder 30+ methods, Schema Builder, View directives, DI decorators, Sessions |
| **0.1.0** | 2026-02-24 | Initial release — 12 packages, core framework |

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct, development workflow, and how to submit pull requests.

## 🔒 Security

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

---

## 📝 License

MIT License — GAO Framework Team.
