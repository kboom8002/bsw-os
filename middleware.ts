import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const LOCALES = ['ko', 'en'];
const DEFAULT_LOCALE = 'ko';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, internal paths, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname) ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if pathname has a locale prefix
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Detect locale from cookie or headers
  let locale = DEFAULT_LOCALE;
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      if (acceptLanguage.toLowerCase().includes('en')) {
        locale = 'en';
      }
    }
  }

  // Redirect to /[locale]/...
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Apply middleware to all routes except standard static patterns
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
