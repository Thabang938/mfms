import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();

  // Initialize Supabase client for middleware
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Get session from Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, redirect to Login
    if (!session) {
      const loginUrl = new URL('/Login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
    return res;
  } catch (err) {
    console.error('Middleware error:', err);
    const loginUrl = new URL('/Dashboard', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Apply middleware only to the /Dashboard route
export const config = {
  matcher: ['/Dashboard/:path*'],
};
