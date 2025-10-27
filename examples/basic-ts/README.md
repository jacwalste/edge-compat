# Basic TypeScript Example

This example demonstrates various Edge Runtime compatibility issues in a plain TypeScript project.

## Issues in this example

All in `src/index.ts`:

- Uses `axios` instead of `fetch`
- Uses `pg` instead of Edge-compatible database driver
- Uses `ws` library instead of native WebSocket
- Uses `net` module (forbidden)
- Uses `child_process` module (forbidden)
- Uses `eval()` (dangerous pattern)
- Uses synchronous WASM instantiation

## Test the scanner

From the repository root:

```bash
# Build the CLI
pnpm build

# Scan this example
pnpm --filter edge-compat exec edge-compat scan examples/basic-ts/src

# Or with strict mode (warnings become errors)
pnpm --filter edge-compat exec edge-compat scan examples/basic-ts/src --strict

# Output as JSON
pnpm --filter edge-compat exec edge-compat scan examples/basic-ts/src --format json

# Output as Markdown report
pnpm --filter edge-compat exec edge-compat scan examples/basic-ts/src --format md
```

You should see many findings with suggestions for Edge-safe alternatives.

