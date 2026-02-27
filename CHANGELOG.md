# Changelog

All notable changes to the GAO Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.5.0] - 2026-02-27

### Added — `@gao/ui` Package (NEW)

#### GaoType — 10 Built-in Font Families
- **GaoSans** — Geometric sans-serif (body, UI labels) — Weights: 300, 400, 500, 600, 700
- **GaoMono** — Monospace for code/terminal — Weights: 400, 700
- **GaoDisplay** — Wide display for hero headings — Weights: 700, 900
- **GaoSlab** — Slab-serif for editorial/blog — Weights: 400, 700
- **GaoRounded** — Rounded sans for friendly UI — Weights: 400, 500, 700
- **GaoCondensed** — Condensed for data tables — Weights: 400, 600
- **GaoScript** — Script for decorative accents — Weight: 400
- **GaoPixel** — Pixel font for retro themes — Weight: 400
- **GaoHandwriting** — Handwriting for annotations — Weight: 400
- **GaoTerminal** — Terminal aesthetic for CLI — Weights: 400, 700
- **FontRegistry** — `registerFont()`, `getFont()`, `generateFontCSS()`, `injectFonts()` with selective injection
- CSS `@font-face` with override metrics for fallback consistency

#### GaoIcons — 200 Dual-Tone SVG Icons
- **10 Categories** × 20 icons each: Navigation, Actions, Media, Social, Data, Status, Commerce, Device, Nature, Misc
- **`gaoIcon(name, options)`** — Inline SVG renderer with size, weight (light/regular/bold), color, spin, pulse, accessibility title
- **`gaoIconSprite(names)`** — SVG sprite sheet generator for `<use>` references
- **Dual-tone design** — Outline + subtle accent fill (`currentColor` + `opacity: 0.15`)
- TypeScript `GaoIconName` union type (200 values) for compile-time safety
- Tree-shakeable — each category is a separate ES module

#### GaoAdmin — Glassmorphism Admin Template
- **CSS Design System** — 12 HSL semantic tokens, dark/light mode (auto + toggle), glassmorphism, responsive breakpoints
- **Admin Layout** — `createAdminTemplate.layout()` generates full HTML pages with sidebar, navbar, content
- **14 Components** — `statCard`, `dataTable`, `barChart`, `lineChart`, `donutChart`, `form`, `breadcrumb`, `toast`, `modal`, `badge`, `progress`, `avatar`, `emptyState`, `alertBanner`
- **SVG Charts** — Bar, line, donut charts without Chart.js (pure SVG path generation)
- **Vanilla JS** — Sidebar toggle, dark mode + localStorage, dropdown menus, Ctrl+K search, toast API, modal API, tab navigation
- All CSS prefixed `.gao-admin-*` — no global leaks
- **Zero external dependencies**

#### gaoUIPlugin — View Engine Integration
- **`gaoUIPlugin(options)`** — Framework plugin that registers all UI helpers into DI container
- **Selective activation** — `{ fonts: true, icons: false, admin: true }` for fine-grained control
- **Backward compatible** — `@gao/view` works fine without the plugin
- **Graceful degradation** — No crash when view engine not loaded

### Stats
- **Test Files:** 6 | **Tests:** 68 | ✅ All passing
- **New Files:** 37 source + test files
- **Zero Dependencies** — All assets embedded inline (CSS, SVG paths, JS)

---

## [0.4.0] - 2026-02-27

### Added — Efficiency Primitives (Apple-inspired)
- **ObjectPool\<T\>** — Generic bounded object pool with pre-warming, reset-on-release, and hit ratio statistics (`@gao/core`)
- **LRUCacheAdapter** — Memory-bounded LRU cache with byte-level budgeting, automatic eviction, TTL, and hit/miss statistics (`@gao/core`)
- **SlidingWindowLimiter** — Sliding window rate limiter with per-key tracking and automatic cleanup (`@gao/core`)
- **RingBuffer\<T\>** — Fixed-capacity circular buffer for bounded metric storage (`@gao/monitor`)
- **parseJsonStream()** / **parseFormStream()** — Zero-copy stream body parsers avoiding Request.clone() duplication (`@gao/http`)
- **GaoResponse.reset()** — Enables response object reuse via ObjectPool

### Added — Isolation & Security (Deno/Cloudflare-inspired)
- **Permission System** — Deno-style permission declarations with hierarchical wildcard matching (`db:read`, `net:fetch:*`) (`@gao/core`)
- **ScopedContainer** — Restricted DI container enforcing permission checks per plugin — blocks unauthorized service access
- **Budget System** — Multi-dimensional resource enforcement via AsyncLocalStorage: DB queries, CPU time, response size, concurrency (`@gao/core`)
- **BudgetPlan tiers** — Pre-defined `free`, `pro`, `enterprise` plans with configurable limits
- **trackDbQuery()** / **trackResponseBytes()** / **checkCpuBudget()** — Auto-tracking helper functions (no-op outside budget scope)
- **BudgetExceededError** — 429 error with dimension metadata (CPU_TIME, DB_QUERIES, RESPONSE_SIZE, CONCURRENT)

### Added — Plugin Marketplace Architecture
- **PluginManifest** — `gao-plugin.json` interface with name, version, permissions, sandbox type, hooks, budget overrides (`@gao/core`)
- **validateManifest()** — Runtime validation for plugin manifests
- **WorkerSandbox** — Worker Thread isolation with V8 `resourceLimits`, timeout enforcement, message-based RPC, crash recovery
- **plugin-worker-host.ts** — Sandboxed worker runtime with restricted globals (no `process.exit`, no `process.kill`)
- **PluginMarketplace** — Lifecycle orchestrator: install (trusted/worker), hook broadcast, uninstall, shutdown

### Added — Resource Monitoring (`@gao/monitor` — new package)
- **MetricsCollector** — Counter, gauge, histogram instruments with label support
- **toPrometheus()** — Prometheus text format export for `/metrics` endpoints
- **toJSON()** — Structured JSON export for dashboards
- **SystemMonitor** — Periodic CPU, memory, event loop lag collection with RingBuffer history
- **SystemSnapshot** — Rich snapshot interface (CPU %, RSS, heap, load avg, uptime)

### Changed
- `@gao/core` barrel exports now include all v0.4.0 modules
- `@gao/http` barrel exports stream parser

## [0.3.0] - 2026-02-27

### Added

#### `@gao/http` — Middleware Factory Functions
- `bodyParserMiddleware()` — auto-parses JSON/form bodies for non-GET requests
- `corsMiddleware(options)` — CORS with string, array, or function-based origins; preflight handling
- `sessionMiddleware(config)` — cookie-based session lifecycle; loads/saves with Set-Cookie
- `flashMiddleware()` — flash messages (ages data per request); requires session middleware
- `errorHandlerMiddleware()` — global try-catch wrapping the pipeline

#### `@gao/http` — `createHttpHandler()` Factory
- Wires controllers, DI container, and global middleware into a single `FetchHandler`
- Auto-registers `@Validate()` schema middleware on decorated handlers
- Route matching with `:param` support and 404 for unmatched routes
- Per-route middleware chains from `@UseMiddleware()` decorator

#### `@gao/http` — Controller DI Integration
- `ControllerRegistry.setContainer(container)` — optional DI for controller resolution
- Controllers instantiated via `container.resolveClass()` when container is provided
- Backward compatible — falls back to `new Class()` without container

#### `@gao/http` — Redis Session Store
- `RedisSessionStore` implementing `SessionStore` interface
- JSON serialization + TTL via `SET EX` + key prefixing (`gao:session:`)

#### `@gao/core` — Redis Cache Adapter
- `RedisCacheAdapter` implementing `CacheAdapter` with key prefixing and JSON serialization
- `RedisLikeClient` interface — abstracts ioredis methods, avoids hard dependency
- `createRedisClient(config)` factory with dynamic `import('ioredis')` for optional peer dep
- Supports `clear(namespace?)` with KEYS pattern matching

#### `@gao/http` — File Upload Enhancements
- `UploadedFile` upgraded from interface to class with utility methods:
  - `saveTo(path)` — move from temp to permanent location
  - `toBuffer()` — read file into memory
  - `toBase64()` / `toDataUri()` — encoding utilities
  - `cleanup()` — delete temp file
- Added `maxFiles` limit to `parseMultipart()` options

#### `@gao/cli` — CLI Command Implementations
- **`gao migrate`**: `run`, `rollback [steps]`, `status`, `refresh [--force]`, `make <name>`
- **`gao seed`**: `run`, `fresh` (refresh + seed)
- **`gao dev`**: auto-detects Bun/Node, starts hot-reload dev server (`bun --watch` / `tsx watch`)
- **`gao build`**: TypeScript compilation via `tsc` with optional `--clean` flag
- **`gao generate seeder <name>`**: new seeder scaffold type
- AppLoader helper: config scanning, migration/seeder directory resolution

### Changed
- `GaoRequest` now has typed `session`, `flash`, `validated<T>()`, and `setValidated()` properties
- `ControllerRegistry` supports optional `Container` for DI-based controller instantiation
- Middleware pipeline correctly clones `Response` objects for post-handler header injection (CORS, session cookies)

### Tests
- **32+ new tests** across 3 new test files:
  - `middlewares.test.ts` — 14 tests (body parser, CORS, session, flash, error handler, composition)
  - `handler.test.ts` — 6 tests (route matching, params, 404, validation, DI)
  - `redis.test.ts` — 12 tests (get/set, TTL, delete, has, clear, namespace, destroy)

---

## [0.2.0] - 2026-02-27

### Added

#### `@gao/orm` — Active Record Pattern
- **`Model` class** with static finders: `find()`, `findOrFail()`, `all()`, `where()`, `create()`, `updateOrCreate()`
- **Instance persistence**: `save()` (auto INSERT/UPDATE based on dirty tracking), `destroy()` (soft/hard delete), `refresh()`
- **Eager loading**: `Model.with('relation1', 'relation2').get()` — eliminates N+1 queries
- **`ModelQueryBuilder`** wrapper that returns hydrated model instances
- **Dirty tracking**: `isDirty()`, `getDirty()`, `syncOriginal()` for efficient UPDATE queries

#### `@gao/orm` — QueryBuilder Extensions (20+ new methods)
- `whereIn(col, values[])`, `whereNotIn(col, values[])`
- `whereNull(col)`, `whereNotNull(col)`
- `whereBetween(col, [min, max])`
- `whereRaw(sql, params[])`
- `selectRaw(expression)`
- `groupBy(col)`, `having(col, op, value)`
- `count()`, `sum(col)`, `avg(col)`, `min(col)`, `max(col)`
- `pluck(col)`, `exists()`
- `insertMany(data[])`, `upsert(data, conflictCols[])`
- `increment(col, amount)`, `decrement(col, amount)`
- `rightJoin(table, first, op, second)`

#### `@gao/orm` — Schema Builder Extensions
- **8 new column types**: `decimal`, `numeric`, `json`, `jsonb`, `date`, `time`, `serial`, `bigserial`
- `enum(name, values[])` with CHECK constraints
- `timestamps()` helper (creates `created_at` + `updated_at`)
- `foreignKey(col, refTable, refCol, onDelete)`
- `index(cols[])`, `uniqueIndex(cols[])`, `check(expression)`
- **`AlterTableBuilder`**: `addColumn()`, `dropColumn()`, `renameColumn()`, `addForeignKey()`
- `Schema.alter(table, callback)`, `Schema.dropIfExists()`, `Schema.rename()`

#### `@gao/orm` — Migration Engine Enhancements
- **Batch tracking**: migrations grouped by batch number
- `down(migrations, steps)` — multi-step rollback
- `reset()` — rollback all migrations
- `refresh()` — reset + re-apply
- `status()` — list all migrations with ran/pending status, batch number, and execution date

#### `@gao/view` — Control Flow Directives
- `@if(condition)` / `@elseif(condition)` / `@else` / `@endif`
- `@foreach(items as item)` / `@foreach(items as item, index)` / `@endforeach`
- `@unless(condition)` / `@endunless`
- `@switch(expr)` / `@case(value)` / `@default` / `@break` / `@endswitch`
- `@empty(array)` / `@endempty`
- `@json(data)` — outputs `JSON.stringify(data)` (escaped)
- `@class({ 'class-name': condition })` — conditional CSS classes
- Balanced parenthesis matching for robust directive parsing

#### `@gao/core` — Constructor Dependency Injection
- `@Inject(token)` parameter decorator for constructor DI
- `@Injectable()` class decorator
- `Container.resolveClass(Class)` — auto-injects dependencies from metadata
- `Container.autoRegister(Class)` — convenience registration
- Supports string, symbol, and class-based tokens

#### `@gao/http` — Request Validation
- `@Validate(zodSchema)` method decorator — auto-validates request body
- `validateData(schema, data)` imperative validation API
- `HttpValidationError` with field-level error messages (HTTP 422)

#### `@gao/http` — Session Management
- `Session` class with typed `get<T>()`, `set()`, `has()`, `delete()` and dirty tracking
- `SessionManager` — cookie parsing, session load/save/destroy/regenerate
- `MemorySessionStore` for development (TTL + max session eviction)
- `SessionStore` interface for custom store implementations
- `FlashMessages` — one-time session data pattern with `flash()`, `get()`, `age()`

#### `@gao/http` — HTTP Exception Classes
- `HttpException` base class
- `NotFoundException` (404), `BadRequestException` (400)
- `UnauthorizedException` (401), `ForbiddenException` (403)
- `ConflictException` (409), `UnprocessableEntityException` (422)
- `TooManyRequestsException` (429)
- Enhanced global `errorHandler` with dev/prod modes and correlation IDs

### Changed
- `Container.resolve()` now supports class-based resolution via `resolveClass()`
- `errorHandler` includes correlation IDs and environment-aware error masking

### Tests
- **112+ new tests** across all enhanced packages
- New test files: `query-builder-ext.test.ts`, `active-record.test.ts`, `schema-ext.test.ts`, `control-flow.test.ts`, `session.test.ts`

---

## [0.1.0] - 2026-02-24

### Added
- Initial framework release with all 12 packages
- `@gao/core` — DI Container, Config Loader, Radix Router, Logger, Cache, Events, Plugins
- `@gao/security` — Full security middleware stack (CSRF, CORS, Helmet, Rate Limiter, etc.)
- `@gao/orm` — QueryBuilder, BaseModel, Decorators, Relations, Hooks, Migration Engine, Seeder
- `@gao/http` — Server (Bun/Node), Controllers, Decorators, Middleware Pipeline, Compression
- `@gao/cli` — Project scaffolding, code generation
- `@gao/testing` — TestApp factory, MockRequestBuilder, assertions
- `@gao/view` — Template engine with auto-escaping, layouts, sections, components
- `@gao/desktop` — Tauri v2 integration
- `@gao/mobile` — Capacitor integration
- `@gao/queue` — BullMQ job queue
- `@gao/email` — Nodemailer transport with templates
- `@gao/websocket` — Socket.IO with JWT auth
