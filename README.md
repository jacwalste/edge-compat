# edge-compat

[![CI](https://github.com/jackstepanek/edge-compat/workflows/CI/badge.svg)](https://github.com/jackstepanek/edge-compat/actions)
[![npm version](https://img.shields.io/npm/v/edge-compat.svg)](https://www.npmjs.com/package/edge-compat)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Static analysis tool for detecting Edge Runtime compatibility issues in JavaScript and TypeScript projects.

## Overview

edge-compat is a CLI scanner and runtime helper toolkit designed to identify code patterns and dependencies that are incompatible with Edge Runtime environments such as Vercel Edge Functions, Cloudflare Workers, Next.js Edge Runtime, and Deno Deploy.

The tool analyzes your codebase for:
- Node.js core module usage (fs, net, child_process, etc.)
- Incompatible runtime patterns (eval, synchronous WebAssembly, blocking operations)
- Dependencies with Node-specific implementations
- Provides actionable replacement suggestions with migration paths

## Installation

```bash
# Run without installing
npx edge-compat scan

# Install globally
npm install -g edge-compat

# Install as dev dependency
npm install -D edge-compat
```

## Usage

### Basic Commands

```bash
# Scan current directory
edge-compat scan

# Scan specific paths
edge-compat scan src/middleware.ts src/app/api

# Output formats
edge-compat scan --format pretty    # Terminal output (default)
edge-compat scan --format json      # Machine-readable JSON
edge-compat scan --format md        # Markdown report

# Target specific runtime
edge-compat scan --edge-target next
edge-compat scan --edge-target cloudflare

# Strict mode (warnings as errors)
edge-compat scan --strict

# Generate configuration file
edge-compat init
```

### Output Example

```
Edge Compatibility Scan Results
────────────────────────────────────────────────────────

Severity  Count
Errors      5
Warnings    3

Findings:

[ERROR] Usage of Node.js "fs" module detected [node-core/forbidden-module:fs]
  at src/middleware.ts:3:8

  3 | import fs from 'fs';
    |        ^^

  Suggestions:
  - Remove file system operations or move them to server-side API routes
  - For Next.js, use getStaticProps or getServerSideProps
    Docs: https://nextjs.org/docs/basic-features/data-fetching
```

## Detection Rules

### Node.js Core Modules

The scanner detects usage of Node.js core modules that are unavailable in Edge runtimes:

| Module | Status | Alternative |
|--------|--------|-------------|
| `fs` | Forbidden | KV storage, R2, or build-time file access |
| `net`, `tls` | Forbidden | `fetch()` API or WebSocket |
| `child_process` | Forbidden | Server-side API routes or background jobs |
| `dns` | Forbidden | DNS-over-HTTPS services |
| `vm`, `module` | Forbidden | Static imports only |
| `zlib` | Forbidden | CompressionStream (Web Streams API) |
| `crypto` | Caution | Prefer Web Crypto API (`crypto.subtle`) |
| `buffer` | Caution | Prefer Uint8Array and Web APIs |
| `stream` | Caution | Prefer Web Streams (ReadableStream, etc.) |

### Runtime Patterns

- `eval()` and `new Function()` - Disallowed due to CSP restrictions
- Synchronous WebAssembly instantiation - Must use async methods
- Long setTimeout/setInterval delays (>30s) - Exceed typical execution limits
- Blocking synchronous operations

### Dependencies

The tool maintains a curated list of packages with Edge-incompatible implementations:

| Package | Replacement | Reason |
|---------|-------------|--------|
| `jsonwebtoken` | `jose` | Relies on Node crypto and Buffer APIs |
| `axios` | `fetch` (native) | Uses Node.js http adapter |
| `pg`, `mysql2` | `@neondatabase/serverless`, `@planetscale/database` | Requires TCP socket connections |
| `ws` | `WebSocket` (native) | Depends on Node net module |
| `bcrypt` | `bcryptjs` | Native bindings unavailable |
| `sharp` | Platform image APIs | Native bindings unavailable |
| `puppeteer` | External service | Requires Chrome binary |
| `dotenv` | Build-time env vars | Runtime file system access unavailable |

See full list in [packages/rules/src/recipes/replacements.ts](./packages/rules/src/recipes/replacements.ts).

## Configuration

Generate a configuration file with `edge-compat init`:

```typescript
// edgecompat.config.ts
import { defineConfig } from '@edge-compat/rules';

export default defineConfig({
  // Target runtime environment
  edgeTarget: 'next', // 'next' | 'vercel' | 'cloudflare' | 'deno' | 'auto'
  
  // Strict mode: treat warnings as errors
  strict: false,
  
  // File patterns
  include: ['src/**/*.{ts,tsx,js,jsx,mts,mjs}'],
  exclude: ['node_modules/**', 'dist/**', '.next/**'],
  
  // Rule configuration
  rules: {
    // Disable specific rules
    'node-core/forbidden-module:fs': 'off',
    
    // Adjust severity
    'node-core/caution:crypto': 'warn',
    
    // Configure with options
    'deps/not-edge-safe': {
      severity: 'error',
      ignore: ['legacy-package'],
    },
  },
});
```

## Runtime Helpers

The `@edge-compat/runtime` package provides utilities for Edge-safe code:

```bash
npm install @edge-compat/runtime
```

```typescript
import { isEdge, assertEdgeSafe, jsonResponse, safeCrypto } from '@edge-compat/runtime';

// Runtime detection
if (isEdge()) {
  console.log('Running in Edge environment');
}

// Safety assertions
assertEdgeSafe('middleware'); // Throws if Node.js APIs detected

// Response helpers
export function GET(request: Request) {
  return jsonResponse({ status: 'ok' });
}

// Safe crypto operations
const id = safeCrypto.randomUUID();
const hash = await sha256('data');
```

## Migration Examples

### Next.js Edge Middleware

**Before (incompatible):**
```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

export function middleware(req) {
  const secret = fs.readFileSync('./secret.txt', 'utf-8');
  const token = jwt.sign({ user: 'test' }, secret);
  return NextResponse.next();
}
```

**After (Edge-compatible):**
```typescript
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

### Cloudflare Worker Database Access

**Before (incompatible):**
```typescript
import { Pool } from 'pg';

export default {
  async fetch(request) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT * FROM users');
    return Response.json(result.rows);
  }
}
```

**After (Edge-compatible):**
```typescript
import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request, env) {
    const sql = neon(env.DATABASE_URL);
    const result = await sql`SELECT * FROM users`;
    return Response.json(result);
  }
}
```

## Packages

This monorepo contains three packages:

| Package | Description |
|---------|-------------|
| [`edge-compat`](./packages/cli) | CLI scanner with reporting capabilities |
| [`@edge-compat/rules`](./packages/rules) | Rule engine and detection logic |
| [`@edge-compat/runtime`](./packages/runtime) | Runtime helper utilities |

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

- `0` - No issues detected
- `1` - Issues found (non-strict mode)
- `2` - Errors or strict violations
- `3` - CLI execution error

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

## Architecture

The scanner uses regex-based pattern matching to detect Node.js API usage and import statements. Future versions may incorporate AST-based analysis for more sophisticated detection.

Detection pipeline:
1. File discovery using glob patterns
2. Content analysis via registered rule detectors
3. Finding aggregation with severity classification
4. Report generation in requested format

## Roadmap

- [x] Core scanner with 20+ detection rules
- [x] Multiple output formats (TTY, JSON, Markdown)
- [x] Runtime helper utilities
- [x] Dependency replacement mappings
- [ ] Automatic code transformations (codemods)
- [ ] Bundle analysis via esbuild metafile
- [ ] VSCode extension integration
- [ ] Interactive fix wizard
- [ ] Optional telemetry for usage analytics

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

Requirements:
- Use conventional commit messages
- Add tests for new rules
- Update documentation as needed
- Follow existing code patterns

## License

MIT License - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2025 Jack Stepanek

## Technical Details

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [ts-morph](https://github.com/dsherret/ts-morph) - TypeScript compiler API wrapper
- [esbuild](https://esbuild.github.io/) - Bundler for dependency analysis
- [Vitest](https://vitest.dev/) - Unit testing framework

Tested on Node.js 18, 20, and 22.
