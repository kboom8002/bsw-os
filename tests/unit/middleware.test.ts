import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '../../middleware';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: vi.fn(() => ({ type: 'next' })),
      redirect: vi.fn((url: any) => ({ type: 'redirect', url })),
    },
  };
});

describe('BSW-OS i18n Routing Middleware Tests (TDD-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (params: {
    pathname: string;
    cookieLocale?: string;
    acceptLanguage?: string;
  }) => {
    const nextUrl = {
      pathname: params.pathname,
      clone: () => ({ ...nextUrl }),
    } as any;

    return {
      nextUrl,
      cookies: {
        get: vi.fn((name: string) => {
          if (name === 'NEXT_LOCALE' && params.cookieLocale) {
            return { value: params.cookieLocale };
          }
          return undefined;
        }),
      },
      headers: {
        get: vi.fn((name: string) => {
          if (name === 'accept-language' && params.acceptLanguage) {
            return params.acceptLanguage;
          }
          return null;
        }),
      },
    } as any;
  };

  it('should skip middleware for static assets and API routes', () => {
    const staticPaths = [
      '/_next/static/chunks/main.js',
      '/api/truth/strategic-claim',
      '/static/logo.png',
      '/favicon.ico',
      '/hero-image.jpg',
    ];

    staticPaths.forEach((path) => {
      const req = createMockRequest({ pathname: path });
      const res = middleware(req);
      expect(res).toEqual({ type: 'next' });
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  it('should pass through if pathname already has a supported locale prefix', () => {
    const localePaths = [
      '/ko',
      '/ko/truth/strategic-claim',
      '/en',
      '/en/observatory',
    ];

    localePaths.forEach((path) => {
      vi.clearAllMocks();
      const req = createMockRequest({ pathname: path });
      const res = middleware(req);
      expect(res).toEqual({ type: 'next' });
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  it('should redirect to cookie locale if cookie is set to a supported locale', () => {
    const req = createMockRequest({
      pathname: '/dashboard',
      cookieLocale: 'en',
    });

    const res = middleware(req) as any;
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.url.pathname).toBe('/en/dashboard');
  });

  it('should redirect to accept-language language if cookie is absent but header is present', () => {
    const req = createMockRequest({
      pathname: '/dashboard',
      acceptLanguage: 'en-US,en;q=0.9',
    });

    const res = middleware(req) as any;
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.url.pathname).toBe('/en/dashboard');
  });

  it('should fallback to default locale (ko) if no cookie or accept-language is set', () => {
    const req = createMockRequest({
      pathname: '/dashboard',
    });

    const res = middleware(req) as any;
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.url.pathname).toBe('/ko/dashboard');
  });
});
