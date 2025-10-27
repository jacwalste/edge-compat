# edge-compat

<div align="center">

[![CI](https://github.com/jackstepanek/edge-compat/workflows/CI/badge.svg)](https://github.com/jackstepanek/edge-compat/actions)
[![npm version](https://img.shields.io/npm/v/edge-compat.svg)](https://www.npmjs.com/package/edge-compat)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A powerful CLI scanner and runtime helper toolkit for detecting and fixing Edge Runtime compatibility issues in JavaScript/TypeScript projects.**

[Quick Start](#quick-start) • [Features](#features) • [Documentation](#documentation) • [Examples](#examples)

</div>

---

## What is edge-compat?

**edge-compat** helps you identify and fix compatibility issues when deploying code to Edge Runtimes like:
- ✅ **Vercel Edge Functions & Middleware**
- ✅ **Cloudflare Workers**
- ✅ **Next.js Edge Runtime**
- ✅ **Deno Deploy**

The toolkit automatically scans your codebase for:
- 🚫 Forbidden Node.js core modules (`fs`, `net`, `child_process`, etc.)
- ⚠️  Problematic patterns (`eval()`, sync WASM, long timers)
- 📦 Non-Edge-safe dependencies (`jsonwebtoken` → `jose`, `pg` → `@neondatabase/serverless`)
- 💡 Provides actionable suggestions with replacement code

---

## Quick Start

### Installation

```bash
# Run without installing
npx edge-compat scan

# Or install globally
npm install -g edge-compat

# Or install as dev dependency
npm install -D edge-compat
```

### Basic Usage

```bash
# Scan current directory
edge-compat scan

# Scan specific paths
edge-compat scan src/middleware.ts src/app/api

# Output formats
edge-compat scan --format pretty    # Colorful TTY output (default)
edge-compat scan --format json      # Machine-readable JSON
edge-compat scan --format md        # Markdown report file

# Target specific runtime
edge-compat scan --edge-target next
edge-compat scan --edge-target cloudflare

# Strict mode (warnings become errors)
edge-compat scan --strict
```

### Example Output

<img src="docs/assets/scan-example.png" alt="Scanner output example" width="700" />

```
🔍 Edge Compatibility Scan Results
────────────────────────────────────────────────────────

Severity  Count
✖ Errors    5
⚠ Warnings  3
ℹ Info      1

Findings:

✖ Usage of Node.js "fs" module detected. File system access is not available in Edge runtimes. [node-core/forbidden-module:fs]
  at src/middleware.ts:3:8

> 3 | import fs from 'fs';
    |        ^^

  Suggestions:
  • Remove file system operations or move them to server-side API routes
  • For Next.js, use getStaticProps or getServerSideProps for build-time or server-side file access
    Docs: https://nextjs.org/docs/basic-features/data-fetching

...
```

---

## Features

### 🔍 Comprehensive Scanning

- **Node.js Core Modules**: Detects forbidden modules like `fs`, `net`, `child_process`, `vm`, etc.
- **Caution Modules**: Warns about `crypto` (prefer Web Crypto), `buffer` (prefer Uint8Array), `stream` (prefer Web Streams)
- **Dangerous Patterns**: Finds `eval()`, `new Function()`, sync WASM instantiation, long timers
- **Dependencies**: Identifies 15+ common packages that don't work in Edge with recommended replacements

### 📋 Multiple Output Formats

- **Pretty TTY**: Colorful, human-readable console output with code frames
- **JSON**: Structured output for CI/CD integration
- **Markdown**: Beautiful report files with full context and links

### 🔧 Auto-Fix (Coming Soon)

```bash
# Preview fixes (dry-run)
edge-compat fix

# Apply fixes automatically
edge-compat fix --apply
```

### ⚙️ Configurable

Generate a config file:

```bash
edge-compat init
```

This creates `edgecompat.config.ts`:

```typescript
export default {
  edgeTarget: 'next',
  strict: false,
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['node_modules/**', 'dist/**'],
  rules: {
    'node-core/forbidden-module:fs': 'error',
    'node-core/caution:crypto': 'warn',
    'deps/not-edge-safe': 'error',
  },
};
```

### 🏃 Runtime Helpers

Install the runtime package for Edge-safe utilities:

```bash
npm install @edge-compat/runtime
```

```typescript
import { isEdge, assertEdgeSafe, jsonResponse, safeCrypto } from '@edge-compat/runtime';

// Detect Edge runtime
if (isEdge()) {
  console.log('Running in Edge!');
}

// Assert Edge safety (throws if Node.js APIs detected)
assertEdgeSafe('middleware');

// Response helpers
export function GET(request: Request) {
  return jsonResponse({ message: 'Hello!' });
}

// Safe crypto
const id = safeCrypto.randomUUID();
const hash = await sha256('hello world');
```

---

## What Does It Check?

### Forbidden Node.js Core Modules

| Module | Reason | Suggestion |
|--------|--------|------------|
| `fs` | File system not available | Use KV storage, R2, or build-time reads |
| `net`, `tls` | No raw sockets | Use `fetch()` or WebSocket |
| `child_process` | No subprocesses | Move to API routes or background jobs |
| `dns` | DNS module unavailable | Use DNS-over-HTTPS services |
| `vm`, `module` | Module internals unavailable | Use static imports |
| `zlib` | Compression unavailable | Use CompressionStream (Web Streams) |

### Problematic Dependencies

| Package | Replacement | Why |
|---------|-------------|-----|
| `jsonwebtoken` | `jose` | Uses Node crypto/buffer |
| `axios` | `fetch` (native) | Uses Node http adapter |
| `pg`, `mysql2` | `@neondatabase/serverless`, `@planetscale/database` | Requires TCP sockets |
| `ws` | `WebSocket` (native) | Uses Node net module |
| `bcrypt` | `bcryptjs` | Native bindings unavailable |
| `sharp` | Vercel/CF Image APIs | Native bindings unavailable |
| `puppeteer` | External service | Requires Chrome binary |
| `dotenv` | Build-time env vars | Runtime file access not available |

See [full replacement list](docs/recipes.md).

### Edge Patterns

- ❌ `eval()` and `new Function()` (CSP violations)
- ⚠️ Sync WASM instantiation (use async)
- ⚠️ Long `setTimeout` delays (> 30s)
- ⚠️ CPU-heavy blocking loops

---

## Examples

### Next.js Edge Middleware

```typescript
// ❌ BEFORE (won't work in Edge)
import jwt from 'jsonwebtoken';
import fs from 'fs';

export function middleware(req) {
  const secret = fs.readFileSync('./secret.txt', 'utf-8');
  const token = jwt.sign({ user: 'test' }, secret);
  return NextResponse.next();
}
```

```typescript
// ✅ AFTER (Edge-safe)
import * as jose from 'jose';

export async function middleware(req) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT({ user: 'test' })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);
  return NextResponse.next();
}

export const config = { runtime: 'edge' };
```

### Cloudflare Worker

```typescript
// ❌ BEFORE
import { Pool } from 'pg';

export default {
  async fetch(request) {
    const pool = new Pool({ connectionString: '...' });
    const result = await pool.query('SELECT * FROM users');
    return Response.json(result.rows);
  }
}
```

```typescript
// ✅ AFTER
import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request, env) {
    const sql = neon(env.DATABASE_URL);
    const result = await sql`SELECT * FROM users`;
    return Response.json(result);
  }
}
```

Check out the [examples/](./examples) directory for full working examples.

---

## Packages

This is a monorepo with multiple packages:

| Package | Description |
|---------|-------------|
| [`edge-compat`](./packages/cli) | CLI scanner (this is what you install) |
| [`@edge-compat/rules`](./packages/rules) | Rule engine and detectors |
| [`@edge-compat/runtime`](./packages/runtime) | Runtime helpers for Edge apps |

---

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Run CLI locally
pnpm --filter edge-compat exec edge-compat scan examples/nextjs-edge
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Edge Compatibility Check

on: [push, pull_request]

jobs:
  edge-compat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: npx edge-compat scan --format json --strict
```

### Exit Codes

- `0`: No issues found
- `1`: Issues found (non-strict mode)
- `2`: Errors or strict violations
- `3`: CLI error

---

## Configuration

Full configuration options in `edgecompat.config.ts`:

```typescript
import { defineConfig } from '@edge-compat/rules';

export default defineConfig({
  // Target runtime (auto-detect by default)
  edgeTarget: 'next', // 'next' | 'vercel' | 'cloudflare' | 'deno' | 'auto'
  
  // Strict mode: warnings become errors
  strict: false,
  
  // File patterns
  include: ['src/**/*.{ts,tsx,js,jsx,mts,mjs}'],
  exclude: ['node_modules/**', 'dist/**', '.next/**'],
  
  // Rule configuration
  rules: {
    // Disable a rule
    'node-core/forbidden-module:fs': 'off',
    
    // Change severity
    'node-core/caution:crypto': 'warn',
    
    // Configure with options
    'deps/not-edge-safe': {
      severity: 'error',
      ignore: ['some-legacy-package'],
    },
  },
});
```

---

## Roadmap

- [x] Core scanner with 20+ rules
- [x] CLI with pretty, JSON, and Markdown output
- [x] Runtime helpers package
- [x] Dependency replacement recipes
- [ ] Auto-fix with codemods (`--apply`)
- [ ] Bundle size analysis (esbuild metafile)
- [ ] VSCode extension
- [ ] Interactive fix wizard
- [ ] Telemetry dashboard (opt-in)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-rule`)
3. Commit your changes (use conventional commits)
4. Push to the branch
5. Open a Pull Request

---

## License

MIT © [Jack Stepanek](https://github.com/jackstepanek)

---

## Acknowledgments

Inspired by the challenges of migrating to Edge Runtimes and the need for better developer tooling.

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [ts-morph](https://github.com/dsherret/ts-morph) - TypeScript AST manipulation
- [esbuild](https://esbuild.github.io/) - Blazing fast bundling
- [Vitest](https://vitest.dev/) - Testing framework

---

<div align="center">

**[⭐ Star this repo](https://github.com/jackstepanek/edge-compat) if you find it useful!**

Made with ❤️ for the Edge Runtime community

</div>

