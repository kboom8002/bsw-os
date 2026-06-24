import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const PUBLIC_FILE = /\.(.*)$/;
const LOCALES = ['ko', 'en'];
const DEFAULT_LOCALE = 'ko';

export async function middleware(request: NextRequest) {
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

  // Detect locale from cookie or headers for redirect
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

  // Update supabase session
  const { supabaseResponse, user } = await updateSession(request);

  // Check if pathname has a locale prefix
  const pathnameHasLocale = LOCALES.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  // Extract the path without the locale prefix to check protection
  let pathWithoutLocale = pathname;
  if (pathnameHasLocale) {
    const matchedLocale = LOCALES.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
    if (matchedLocale) {
      pathWithoutLocale = pathname.replace(`/${matchedLocale}`, '') || '/';
    }
  }

  // Check if it's a login route
  const isLoginRoute = pathWithoutLocale === '/login' || pathWithoutLocale.startsWith('/login/');
  
  // Protect all non-login routes (workspaces, etc.)
  if (!user && !isLoginRoute && pathWithoutLocale !== '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${pathnameHasLocale ? pathname.split('/')[1] : locale}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to /[locale]/... if missing locale
  if (!pathnameHasLocale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Apply middleware to all routes except standard static patterns
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
