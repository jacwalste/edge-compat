# Next.js Edge Example

This example demonstrates common Edge Runtime compatibility issues.

## Issues in this example

- `src/middleware.ts`:
  - Uses `fs` module (forbidden)
  - Uses `jsonwebtoken` (not Edge-safe, should use `jose`)
  - Uses `eval()` (forbidden pattern)
  - Uses long `setTimeout` (warning)

- `src/app/api/edge-route/route.ts`:
  - Uses Node.js `crypto` module (caution - prefer Web Crypto)
  - Uses Node.js `Buffer` (caution - prefer Uint8Array)

## Test the scanner

From the repository root:

```bash
# Build the CLI
pnpm build

# Scan this example
pnpm --filter edge-compat exec edge-compat scan examples/nextjs-edge/src
```

You should see multiple findings with suggestions for fixes.

