/**
 * lib/logger.ts
 * Structured logging utility for the BSW-OS QIS pipeline
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  phase?: string;
  durationMs?: number;
  data?: Record<string, unknown>;
  error?: { message: string; stack?: string };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

function createEntry(
  level: LogLevel,
  message: string,
  meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>
): LogEntry {
  return { level, message, timestamp: new Date().toISOString(), ...meta };
}

function output(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const correlation = entry.correlationId ? ` [run:${entry.correlationId.slice(0, 8)}]` : '';
  const phase = entry.phase ? ` [${entry.phase}]` : '';
  const duration = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : '';
  const logMsg = `${prefix}${correlation}${phase}${duration} ${entry.message}`;

  if (entry.level === 'error') {
    console.error(logMsg, entry.data ?? '', entry.error ?? '');
  } else if (entry.level === 'warn') {
    console.warn(logMsg, entry.data ?? '');
  } else {
    console.log(logMsg, entry.data ?? '');
  }
}

export const logger = {
  debug: (message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) =>
    output(createEntry('debug', message, meta)),

  info: (message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) =>
    output(createEntry('info', message, meta)),

  warn: (message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) =>
    output(createEntry('warn', message, meta)),

  error: (
    message: string,
    err?: unknown,
    meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>
  ) => {
    const errorData =
      err instanceof Error
        ? { message: err.message, stack: err.stack }
        : { message: String(err) };
    output(createEntry('error', message, { ...meta, error: errorData }));
  },
};

/**
 * Creates a logger scoped to a specific pipeline run (correlationId = runId)
 */
export function createRunLogger(runId: string) {
  return {
    debug: (message: string, phase?: string, data?: Record<string, unknown>) =>
      logger.debug(message, { correlationId: runId, phase, data }),
    info: (message: string, phase?: string, data?: Record<string, unknown>) =>
      logger.info(message, { correlationId: runId, phase, data }),
    warn: (message: string, phase?: string, data?: Record<string, unknown>) =>
      logger.warn(message, { correlationId: runId, phase, data }),
    error: (message: string, err?: unknown, phase?: string) =>
      logger.error(message, err, { correlationId: runId, phase }),
  };
}
