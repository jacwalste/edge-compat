# @edge-compat/runtime

Runtime helpers for Edge-safe JavaScript/TypeScript applications.

## Installation

```bash
npm install @edge-compat/runtime
# or
pnpm add @edge-compat/runtime
# or
yarn add @edge-compat/runtime
```

## Usage

### Edge Detection

```typescript
import { isEdge, getEdgeRuntime } from '@edge-compat/runtime';

if (isEdge()) {
  console.log('Running in Edge runtime:', getEdgeRuntime());
} else {
  console.log('Running in Node.js');
}
```

### Edge Safety Assertions

```typescript
import { assertEdgeSafe, assertWebCrypto } from '@edge-compat/runtime';

// Throw if Node.js-only APIs are detected
assertEdgeSafe('middleware');

// Assert specific APIs
assertWebCrypto();
```

### Response Helpers

```typescript
import { jsonResponse, errorResponse, redirectResponse } from '@edge-compat/runtime';

// JSON response
export function GET(request: Request) {
  return jsonResponse({ message: 'Hello, Edge!' });
}

// Error response
export function POST(request: Request) {
  if (!isValid(request)) {
    return errorResponse('Invalid request', 400);
  }
  return jsonResponse({ success: true });
}

// Redirect
export function middleware(request: Request) {
  return redirectResponse('/new-path', 302);
}
```

### Safe Crypto

```typescript
import { safeCrypto, randomHex, sha256 } from '@edge-compat/runtime';

// Generate UUID
const id = safeCrypto.randomUUID();

// Generate random hex
const token = randomHex(32);

// Hash a string
const hash = await sha256('hello world');
```

## API Reference

See the [documentation](https://github.com/jacwalste/edge-compat) for full API reference.

## License

MIT

