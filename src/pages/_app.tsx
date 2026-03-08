import * as Sentry from '@sentry/nextjs';
import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useCallback } from 'react';

import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { brandingConfig } from '@/config/brandingConfig';
import { UserProvider, useUserContext } from '@/context/UserContext';
import logger from '@/lib/logger';
import { initializePostHog } from '@/lib/posthog-client';
import '@/styles/globals.css';

function MyAppContent({ Component, pageProps }: AppProps) {
  const { isAuthenticated, isSuperUser, authState } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    initializePostHog();
  }, []);

  const checkAccess = useCallback(async () => {
    const publicRoutes = ['/auth/login', '/auth/signup'];
    const userRoutes = [
      '/documents',
      '/collections',
      '/collection',
      '/chat',
      '/account',
    ];
    const currentPath = router.pathname;

    const isUserRoute = (path: string) => {
      return userRoutes.some((route) => path.startsWith(route));
    };

    if (!isAuthenticated) {
      if (!publicRoutes.includes(currentPath)) {
        router.replace('/auth/login');
      }
      return;
    }

    if (isSuperUser()) {
      return;
    }

    if (!isUserRoute(currentPath)) {
      router.replace('/documents');
    }
  }, [isAuthenticated, isSuperUser, authState.userRole, router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return <Component {...pageProps} />;
}

function MyApp(props: AppProps) {
  // Set up global error handlers
  useEffect(() => {
    // Global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      logger.error('Uncaught error', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason, {
        reason: event.reason?.toString(),
      });
    };

    // Add user context to Sentry when available
    const addUserContext = () => {
      if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
        Sentry.setUser({
          // Add user info if available from auth state
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    addUserContext();

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  // Move the runtime config check into useEffect
  useEffect(() => {
    // Load the env-config.js script dynamically
    const script = document.createElement('script');
    script.src = '/env-config.js';
    script.onload = () => {
      if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
        logger.info('Runtime config loaded', {
          hasDeploymentUrl:
            !!window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL,
        });
      } else {
        logger.warn('Runtime config not found');
      }
    };
    script.onerror = () => {
      logger.error('Failed to load runtime config script');
    };
    document.body.appendChild(script);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange
      >
        <UserProvider>
          <MyAppContent {...props} />
          <Analytics />
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
