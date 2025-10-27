import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs'; // ❌ Not Edge-safe!
import jwt from 'jsonwebtoken'; // ❌ Not Edge-safe!

// This middleware has Edge compatibility issues
export function middleware(request: NextRequest) {
  try {
    // ❌ Using fs in Edge runtime
    const config = fs.readFileSync('./config.json', 'utf-8');
    
    // ❌ Using jsonwebtoken in Edge runtime
    const token = jwt.sign({ user: 'test' }, 'secret');
    
    // ❌ Using eval
    eval('console.log("dangerous")');
    
    // ❌ Long timer in middleware
    setTimeout(() => {
      console.log('This will never execute');
    }, 60000);
    
    return NextResponse.next({
      headers: {
        'x-token': token,
      },
    });
  } catch (error) {
    return new NextResponse('Middleware Error', { status: 500 });
  }
}

export const config = {
  matcher: '/api/:path*',
  runtime: 'edge',
};

