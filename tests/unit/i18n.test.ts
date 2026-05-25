// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { TranslationProvider, useTranslation } from '../../lib/i18n/context';

const mockPush = vi.fn();
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
    usePathname: () => '/ko/dashboard',
  };
});

describe('BSW-OS i18n Translation Context Hook Tests (TDD-05)', () => {
  let capturedContext: any = null;

  const TestComponent = () => {
    capturedContext = useTranslation();
    return React.createElement('div', { id: 'test-node' }, capturedContext.t('common.brand') || 'empty');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = '';
    capturedContext = null;
  });

  it('should initialize with default locale, write to cookie, and execute t() translation', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(
          TranslationProvider,
          { initialLocale: 'ko', children: React.createElement(TestComponent) }
        )
      );
    });

    expect(capturedContext).not.toBeNull();
    expect(capturedContext.locale).toBe('ko');
    expect(document.cookie).toContain('NEXT_LOCALE=ko');

        // dictionaries/ko.json
    const translation = capturedContext.t('common.brand');
    expect(translation).toBeDefined();

    // fallback check
    const missingKeyResult = capturedContext.t('non.existent.key.path');
    expect(missingKeyResult).toBe('non.existent.key.path');

    document.body.removeChild(container);
  });

  it('should switch locale, update cookie, and rewrite path for routing', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(
          TranslationProvider,
          { initialLocale: 'ko', children: React.createElement(TestComponent) }
        )
      );
    });

    act(() => {
      capturedContext.setLocale('en');
    });

    expect(capturedContext.locale).toBe('en');
    expect(document.cookie).toContain('NEXT_LOCALE=en');
    expect(mockPush).toHaveBeenCalledWith('/en/dashboard');

    document.body.removeChild(container);
  });
});
