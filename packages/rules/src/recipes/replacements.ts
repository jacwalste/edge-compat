/**
 * Replacement recipes for non-Edge-safe packages
 */
export interface Replacement {
  from: string;
  to: string;
  reason: string;
  installCommand: string;
  migrationNotes?: string;
  docsUrl?: string;
}

export const REPLACEMENTS: Record<string, Replacement> = {
  'jsonwebtoken': {
    from: 'jsonwebtoken',
    to: 'jose',
    reason: 'jsonwebtoken uses Node.js crypto and Buffer APIs not available in Edge runtimes',
    installCommand: 'npm install jose',
    migrationNotes: 'Replace jwt.sign() with new SignJWT() and jwt.verify() with jwtVerify()',
    docsUrl: 'https://github.com/panva/jose',
  },
  'node-fetch': {
    from: 'node-fetch',
    to: 'fetch (global)',
    reason: 'Edge runtimes have native fetch() support',
    installCommand: 'Remove node-fetch dependency',
    migrationNotes: 'Replace require("node-fetch") with native fetch()',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
  },
  'axios': {
    from: 'axios',
    to: 'fetch (global) or ky',
    reason: 'axios uses Node.js adapters not available in Edge runtimes',
    installCommand: 'npm install ky',
    migrationNotes: 'Use native fetch() or ky for a familiar API',
    docsUrl: 'https://github.com/sindresorhus/ky',
  },
  'pg': {
    from: 'pg',
    to: '@neondatabase/serverless',
    reason: 'pg requires TCP sockets not available in Edge runtimes',
    installCommand: 'npm install @neondatabase/serverless',
    migrationNotes: 'Use Neon serverless driver with HTTP connections',
    docsUrl: 'https://neon.tech/docs/serverless/serverless-driver',
  },
  'mysql2': {
    from: 'mysql2',
    to: '@planetscale/database',
    reason: 'mysql2 requires TCP sockets not available in Edge runtimes',
    installCommand: 'npm install @planetscale/database',
    migrationNotes: 'Use PlanetScale serverless driver with HTTP connections',
    docsUrl: 'https://github.com/planetscale/database-js',
  },
  'mysql': {
    from: 'mysql',
    to: '@planetscale/database',
    reason: 'mysql requires TCP sockets not available in Edge runtimes',
    installCommand: 'npm install @planetscale/database',
    migrationNotes: 'Use PlanetScale serverless driver with HTTP connections',
    docsUrl: 'https://github.com/planetscale/database-js',
  },
  'ws': {
    from: 'ws',
    to: 'WebSocket (global)',
    reason: 'ws uses Node.js net module not available in Edge runtimes',
    installCommand: 'Use native WebSocket API',
    migrationNotes: 'Replace ws.WebSocket with native WebSocket',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket',
  },
  'form-data': {
    from: 'form-data',
    to: 'FormData (global)',
    reason: 'form-data uses Node.js streams not available in Edge runtimes',
    installCommand: 'Use native FormData API',
    migrationNotes: 'Replace form-data with native FormData',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/FormData',
  },
  'uuid': {
    from: 'uuid',
    to: 'crypto.randomUUID()',
    reason: 'uuid can be replaced with native Web Crypto API',
    installCommand: 'Remove uuid dependency',
    migrationNotes: 'Replace uuidv4() with crypto.randomUUID()',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID',
  },
  'dotenv': {
    from: 'dotenv',
    to: 'Build-time environment variables',
    reason: 'dotenv loads .env files at runtime, not suitable for Edge',
    installCommand: 'Remove dotenv dependency',
    migrationNotes: 'Use build-time environment variables (process.env works but is injected at build time)',
    docsUrl: 'https://vercel.com/docs/concepts/projects/environment-variables',
  },
  'bcrypt': {
    from: 'bcrypt',
    to: 'bcryptjs',
    reason: 'bcrypt uses native bindings not available in Edge runtimes',
    installCommand: 'npm install bcryptjs',
    migrationNotes: 'Replace bcrypt with bcryptjs (pure JavaScript implementation)',
    docsUrl: 'https://github.com/dcodeIO/bcrypt.js',
  },
  'firebase-admin': {
    from: 'firebase-admin',
    to: 'Firebase REST API or Edge-compatible SDK',
    reason: 'firebase-admin uses Node.js APIs not available in Edge runtimes',
    installCommand: 'Use Firebase REST API or firebase/auth package',
    migrationNotes: 'Use Firebase Client SDK or REST API for Edge functions',
    docsUrl: 'https://firebase.google.com/docs/reference/rest/auth',
  },
  'sharp': {
    from: 'sharp',
    to: 'Edge-compatible image service',
    reason: 'sharp uses native bindings not available in Edge runtimes',
    installCommand: 'Use Cloudflare Images or Vercel Image Optimization',
    migrationNotes: 'Use platform-specific image optimization services',
    docsUrl: 'https://vercel.com/docs/concepts/image-optimization',
  },
  'puppeteer': {
    from: 'puppeteer',
    to: 'Browser automation service',
    reason: 'puppeteer requires Chrome browser not available in Edge runtimes',
    installCommand: 'Use Browserless, Puppeteer on server routes, or screenshot APIs',
    migrationNotes: 'Move to server-side API routes or use external services',
    docsUrl: 'https://www.browserless.io/',
  },
  'prisma': {
    from: 'prisma (traditional)',
    to: '@prisma/client/edge or Prisma Data Proxy',
    reason: 'Prisma Client uses connection pooling that may not work in Edge',
    installCommand: 'npm install @prisma/client',
    migrationNotes: 'Use Prisma Data Proxy or Prisma Accelerate for Edge',
    docsUrl: 'https://www.prisma.io/docs/guides/deployment/edge/overview',
  },
};

/**
 * Get replacement for a package
 */
export function getReplacement(packageName: string): Replacement | undefined {
  return REPLACEMENTS[packageName];
}

/**
 * Check if a package has a known replacement
 */
export function hasReplacement(packageName: string): boolean {
  return packageName in REPLACEMENTS;
}

/**
 * Get all replacements
 */
export function getAllReplacements(): Replacement[] {
  return Object.values(REPLACEMENTS);
}

