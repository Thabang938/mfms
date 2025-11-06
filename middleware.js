import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();

  // Create a Supabase client for middleware context
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Redirect logged-in users away from `/` to `/Dashboard`
  if (pathname === '/Login' && session) {
    return NextResponse.redirect(new URL('/Dashboard', req.url));
  }

  // Redirect unauthenticated users away from `/Dashboard` to `/`
  if (pathname.startsWith('/Dashboard') && !session) {
    return NextResponse.redirect(new URL('/Login', req.url));
  }

  return res;
}
// PROTECTED ROUTES
export const config = {
  matcher: ['/', '/Dashboard/:path*','/Settings/:path'],
};
