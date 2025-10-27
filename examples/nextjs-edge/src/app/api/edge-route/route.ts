import { NextRequest } from 'next/server';
import { createHash } from 'crypto'; // ⚠️ Caution - prefer Web Crypto
import { Buffer } from 'buffer'; // ⚠️ Caution - prefer Uint8Array

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // ⚠️ Using Node.js crypto instead of Web Crypto
  const hash = createHash('sha256').update('hello').digest('hex');
  
  // ⚠️ Using Buffer instead of Uint8Array
  const data = Buffer.from('test');
  
  return Response.json({
    message: 'Hello from Edge!',
    hash,
    dataLength: data.length,
  });
}

