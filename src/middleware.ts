import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, favicons, and auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('reporteng_session')?.value;
  const isAuthenticated = Boolean(sessionCookie && sessionCookie.includes('.'));

  // If already logged in and visiting login page, redirect to home
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // If not logged in and visiting protected page
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login kembali.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
