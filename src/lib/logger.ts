/**
 * Centralized logging utility that sends logs to both console (for Vercel) and Sentry
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext) {
    const formatted = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  private logToSentry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ) {
    if (level === 'error') {
      if (error) {
        Sentry.captureException(error, {
          level: 'error',
          tags: context,
          extra: context,
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          tags: context,
          extra: context,
        });
      }
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: 'warning',
        tags: context,
        extra: context,
      });
    } else {
      // Add breadcrumb for info/debug
      Sentry.addBreadcrumb({
        message,
        level: level === 'info' ? 'info' : 'debug',
        data: context,
      });
    }
  }

  debug(message: string, context?: LogContext) {
    this.logToConsole('debug', message, context);
    if (process.env.NODE_ENV === 'development') {
      this.logToSentry('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.logToConsole('info', message, context);
    this.logToSentry('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.logToConsole('warn', message, context);
    this.logToSentry('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logToConsole('error', message, context);
    this.logToSentry('error', message, context, error);
  }
}

export const logger = new Logger();
export default logger;
