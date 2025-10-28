# edge-compat

Static analysis tool for detecting Edge Runtime compatibility issues in JavaScript and TypeScript projects.

## Installation

```bash
# Global installation
npm install -g edge-compat

# Or use npx
npx edge-compat
```

## Usage

### Scan for compatibility issues

```bash
# Scan current directory
edge-compat scan

# Scan specific paths
edge-compat scan src/ src/app

# Output formats
edge-compat scan --format pretty    # Terminal output (default)
edge-compat scan --format json      # Machine-readable JSON
edge-compat scan --format md        # Markdown report

# Target specific runtime
edge-compat scan --edge-target next
edge-compat scan --edge-target cloudflare

# Strict mode (warnings as errors)
edge-compat scan --strict
```

### Initialize configuration

```bash
edge-compat init
```

This creates an `edgecompat.config.ts` file with configurable options.

## What It Detects

- **Forbidden Node.js modules**: `fs`, `net`, `child_process`, `dns`, `vm`, etc.
- **Problematic patterns**: `eval()`, synchronous WebAssembly, long-running timers
- **Incompatible dependencies**: `jsonwebtoken`, `axios`, `pg`, `ws`, etc.
- **Caution modules**: `crypto`, `buffer`, `stream` (prefers Web APIs)

## Example

```bash
$ edge-compat scan src/
Edge Compatibility Scan Results
────────────────────────────────────────────────────────

Severity  Count
Errors      5
Warnings    3

Findings:

[ERROR] Package "jsonwebtoken" is not Edge-safe [deps/not-edge-safe]
  at src/middleware.ts:3:0
  
  Suggestions:
  - Replace with: jose
  - Package: npm install jose
  - Docs: https://github.com/panva/jose
```

## Configuration

Create an `edgecompat.config.ts` file:

```typescript
import { defineConfig } from '@edge-compat/rules';

export default defineConfig({
  edgeTarget: 'next',
  strict: false,
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['node_modules/**'],
  rules: {
    'node-core/forbidden-module:fs': 'error',
    'deps/not-edge-safe': 'warn',
  },
});
```

## Output Formats

### Pretty (default)
Colorful terminal output with code frames and suggestions.

### JSON
```json
{
  "findings": [...],
  "fileCount": 42,
  "duration": 123.45
}
```

### Markdown
Generates `edge-compat-report.md` with formatted findings, code snippets, and documentation links.

## Exit Codes

- `0` - No issues detected
- `1` - Issues found (non-strict mode)
- `2` - Errors or strict violations
- `3` - CLI execution error

## Related Packages

- **[@edge-compat/rules](https://www.npmjs.com/package/@edge-compat/rules)** - Rule engine and detectors
- **[@edge-compat/runtime](https://www.npmjs.com/package/@edge-compat/runtime)** - Runtime helper utilities

## Documentation

Full documentation available on [GitHub](https://github.com/jacwalste/edge-compat).

## License

MIT

