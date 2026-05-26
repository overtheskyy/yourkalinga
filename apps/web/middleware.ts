import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Route protection is handled client-side via useAuthStore
  // This middleware handles server-side redirects for root
  const { pathname } = request.nextUrl;
  if (pathname === '/') return NextResponse.next();
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
