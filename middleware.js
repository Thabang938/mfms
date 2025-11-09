import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const navItems = [
  { href: '/Dashboard', roles: ['Fleet Manager', 'Technician', 'Admin Clerk', 'Driver'] },
  { href: '/Dashboard/vehicles', roles: ['Fleet Manager', 'Technician', 'Driver'] },
  { href: '/Dashboard/services', roles: ['Fleet Manager', 'Technician'] },
  { href: '/Dashboard/fuel', roles: ['Fleet Manager', 'Technician', 'Driver'] },
  { href: '/Dashboard/accidents', roles: ['Fleet Manager', 'Driver'] },
  { href: '/Dashboard/licenses', roles: ['Fleet Manager', 'Admin Clerk'] },
  { href: '/Dashboard/tyres', roles: ['Fleet Manager', 'Technician', 'Driver'] },
  { href: '/Dashboard/reports', roles: ['Fleet Manager', 'Admin Clerk'] },
  { href: '/Dashboard/documents', roles: ['Fleet Manager', 'Admin Clerk'] },
  { href: '/Dashboard/drivers', roles: ['Fleet Manager', 'Admin Clerk'] },
];

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get current Supabase session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect if user is not logged in
  if (pathname.startsWith('/Dashboard') && !session) {
    const redirectUrl = new URL('/Login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role from the users table
  let role = null;
  const userId = session?.user?.id;

  if (userId) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError.message);
    }
    role = userData?.role || null;
  }

  // Match the most specific route
  // Sort by length to match deeper routes first (/Dashboard/vehicles before /Dashboard)
  const matchedItem = navItems
    .sort((a, b) => b.href.length - a.href.length)
    .find(item => pathname === item.href || pathname.startsWith(item.href + '/'));

  // Check if user's role is allowed
  if (matchedItem && (!role || !matchedItem.roles.includes(role))) {
    console.warn(`Access denied for role "${role}" to path "${pathname}"`);
    return NextResponse.redirect(new URL('/AccessDenied', req.url));
  }

  return res;
}

// Match all dashboard-related routes
export const config = {
  matcher: ['/Dashboard/:path*', '/Settings/:path*'],
};
