# Getting Started with GAO

GAO makes it incredibly easy to build modern, secure applications.

## Installation

The easiest way to start is using the GAO CLI:

```bash
# Install CLI globally (optional)
pnpm add -g @gao/cli

# Or use npx
npx @gao/cli new my-awesome-app
```

## Project Structure

A new GAO project follows a clean structure:

```text
my-awesome-app/
ΓööΓöÇ src/
Γöé   ΓööΓöÇ controllers/    # Route handlers
Γöé   ΓööΓöÇ services/       # Business logic
Γöé   ΓööΓöÇ models/         # Database entities
Γöé   ΓööΓöÇ migrations/     # Schema versioning
Γöé   ΓööΓöÇ main.ts         # App entry point
ΓööΓöÇ gao.config.ts       # Central configuration
ΓööΓöÇ tsconfig.json       # TypeScript config
ΓööΓöÇ package.json        # Dependencies
```

## Your First Application

```ts
import { createApp, defineConfig } from '@gao/core';
import { GaoResponse } from '@gao/http';

const app = createApp();

// Define a route
app.router.get('/hello', async (req, res: GaoResponse) => {
  return res.json({ message: 'Hello, GAO!' });
});

// Boot the app
await app.boot();
```

## Running the App

```bash
# Start development server
gao dev

# Build for production
gao build
```
