<div align="center">

# 🚀 GAO Framework

**The Next-Generation TypeScript Full-Stack Multi-Platform Framework**

*Security-by-Default • High Performance • Fast User Access • Rapid Development • Multi-Platform Build*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2+-black?logo=bun&logoColor=white)](https://bun.sh/)
[![Security](https://img.shields.io/badge/Security-Strict-red?logo=shield&logoColor=white)](#-security-fortress)
[![Monorepo](https://img.shields.io/badge/Monorepo-Turborepo-orange?logo=vercel&logoColor=white)](#-monorepo-packages)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop%20%7C%20Mobile-green?logo=electron&logoColor=white)](#-multi-platform-ready)

</div>

---

## 🌟 Overview

**GAO Framework** adalah sebuah framework TypeScript full-stack yang dirancang secara khusus untuk era *AI-Assisted Development* (*vibe coding*). Framework ini menerapkan kebijakan **Security-by-Default** yang ketat, memastikan bahwa aplikasi yang dihasilkan (bahkan kode yang di-generate oleh AI) selalu aman untuk di-deploy ke produksi.

Framework ini berjalan di atas **[Bun](https://bun.sh/)** (dengan fallback ke Node.js) dan dipadukan dengan konsep **Convention-over-Configuration** untuk memastikan developer dapat fokus pada logika bisnis tanpa harus bergulat dengan konfigurasi yang berlebihan.

---

## ✨ Key Features & Pillars

1. 🔒 **Security-by-Default**
   - **No `.env` Files**: Konfigurasi diatur menggunakan `gao.config.ts` yang bersifat type-safe dan divalidasi oleh **Zod**.
   - Semua layer middleware keamanan (CSRF, CORS, Rate Limiting, DDoS Shield, CAPTCHA, Helmet, XSS Guard, Input Validation) aktif secara default!
   - Enkripsi native kelas enterprise (AES-256-GCM) & Hashing (Argon2id).
   - *Field-Level Encryption* pada layer database.

2. 🚀 **High Performance**
   - Menggunakan radix-tree router yang super cepat dengan lookup time O(log n).
   - Dioptimalkan untuk Bun runtime.
   - Output render yang telah dikompres (Gzip/Brotli bawaan) & *smart caching*.

3. ⚡ **Rapid Development**
   - **Gao CLI** (`@gao/cli`): Generate code mulai dari project setup, controller, middleware, view, hingga migration.
   - Developer Debug Toolbar: Inspector request, query mapper, dan auto-profiling untuk _rapid testing_.
   - Dependency Injection (DI) Container bawaan yang intuitif dan *memory-safe*.

4. 🌍 **Multi-Platform Build**
   - Tulis kode sekali, compile ke **Web** (SSR/API), **Desktop** (via Tauri v2), dan **Mobile** (via Capacitor).

5. 🛡️ **Type-Safe Database (ORM)**
   - Type-safe Query Builder dengan parameter binding murni (anti SQL Injection).
   - Dukungan Database: PostgreSQL, MySQL, MariaDB, SQLite.
   - Fitur enterprise: *Soft deletes*, *Auto Audit fields*, *Migration Engine*, *Transaction Savepoints*.

---

## 🏗 Architecture Flow

Aplikasi yang dibangun dengan GAO Framework memiliki pipeline _Request Lifecycle_ tersendiri dalam mengeksekusi request masuk:

```text
Client Request
      │
      ▼
┌─────────────────┐
│  Bun Server     │
└────────┬────────┘
│
▼
[ Security Middleware Stack (Helmet, CORS, CSRF, Rate Limiter) ]
│
▼
[ Router (Radix Tree O(log n)) ]
│
▼
[ Validation Middleware (Zod) ]
│
▼
[ User Controller → Service Layer → Query Builder/ORM ]
│
▼
[ Response Builder & Audit Logger ]
│
▼
Client Response (Secure, Typed, Handled)
```

---

## 📦 Monorepo Packages

GAO Framework mengadopsi struktur _Monorepo_ yang dimanajemen melalui **Turborepo** dan **pnpm**.

| Package | Deskripsi | Status |
|---------|-----------|--------|
| `@gao/core` | **Core Engine.** DI Container, Config Loader, Router, Logger (Pino), Cache, Event System. | 🟢 |
| `@gao/security` | **Security Fortress.** Middleware keamanan, JWT, RBAC, Enkripsi, Hashing, Zod Validator. | 🟢 |
| `@gao/orm` | **Data Layer.** Type-safe Query Builder, Driver (Pg/MySQL/SQLite), Migrations, BaseModel. | 🟢 |
| `@gao/http` | **HTTP Layer.** Pipeline Req/Res, Decorators (`@Controller`, `@Get`), Router mapping. | 🟢 |
| `@gao/cli` | **Developer Tools.** Scaffold, generate, dev server, migration runner. | 🟡 |
| `@gao/testing` | **Testing Utils.** Mock DB, App factory, dan Assertions. | 🟡 |
| `@gao/view` | **Template Engine.** SSR, Custom template `.gao`, xss-safe auto escape. | 🟡 |
| `@gao/desktop` | **Desktop Wrapper.** Integrasi dengan Tauri v2. | 🟡 |
| `@gao/mobile` | **Mobile Wrapper.** Integrasi dengan Capacitor. | 🟡 |

*(Status: 🟢 Production Ready | 🟡 Work in Progress | 🔴 Planned)*

---

## 🛠️ Stack & Technologies

- **Runtime:** Bun 1.2+ (Node.js 22+ LTS fallback)
- **Language:** TypeScript 5.7+ (Strict Mode)
- **Validation:** Zod
- **Logging:** Pino
- **Testing:** Vitest
- **Linter/Formatter:** Biome
- **Security Primitives:** native `crypto` (AES-256-GCM), Argon2, Jose (JWT)

---

## 🚀 Getting Started

*(Dokumentasi penggunaan secara detail sedang dalam progres)*

Secara garis besar, untuk membuat projek baru dengan GAO Framework:

```bash
# 1. Install CLI secara global (atau via npx)
pnpm add -g @gao/cli

# 2. Buat projek baru
gao new my-project
cd my-project

# 3. Jalankan development server
gao dev
```

Project baru **TIDAK** menggunakan file `.env`. Semua konfigurasi diatur dalam `gao.config.ts`, contoh:

```typescript
import { defineConfig } from '@gao/core';

export default defineConfig({
  app: {
    name: 'My Application',
    port: 3000,
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    driver: 'postgres',
    url: process.env.DATABASE_URL
  },
  security: {
    cors: { origins: ['https://myapp.com'] }, // Must be explicit
    csrf: { enabled: true }
  }
});
```

Dan gunakan decorator API-nya secara langsung:

```typescript
import { Controller, Get, Validate, Guard } from '@gao/http';
import { z } from 'zod';

@Controller('/api/users')
export class UserController {
  
  @Get('/')
  @Guard('authenticated')
  async list(req: GaoRequest, res: GaoResponse) {
    const users = await User.query().paginate(req.query.page, 20);
    return res.json({ data: users });
  }
}
```

---

## 🛡️ Vibe-Coding Safe

Framework ini secara sistematis menggagalkan _hallucinations_ dan *error code* dari AI (seperti GitHub Copilot atau ChatGPT) dengan cara:

- **Strict Type Checking**: Tidak mengizinkan `any` atau raw query `db.query(string)`.
- **Zod Requirement**: Semua request body yang tidak divalidasi akan berujung object tipe `never`.
- **Environment Boot Failsafe**: Mengandalkan Zod di konfigurasi, mencegah AI *hardcode* tipe konfigurasi yang salah.
- **Fail-Open Security Prevention**: Rate Limiter, Helmet, DDoS Shield, dan XSS Guard tidak perlu diinjeksi manual; Semua secara otomatis memproteksi routing!

---

## 📝 License

Proprietary License - GAO Agent Team.
