/**
 * Structured logging module with severity levels.
 *
 * Provides debug, info, warn, and error logging functions that output
 * formatted log lines with timestamps and severity indicators.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLevel: LogLevel = LogLevel.INFO;

/**
 * Set the global log level threshold.
 * Logs below this level will be suppressed.
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * Get the current log level threshold.
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

/**
 * Format a log message with timestamp and severity prefix.
 */
function formatLog(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const levelStr = LogLevel[level];
  return `[${timestamp}] [${levelStr}] ${message}`;
}

/**
 * Log at DEBUG level.
 */
export function debug(message: string): void {
  if (currentLevel <= LogLevel.DEBUG) {
    console.debug(formatLog(LogLevel.DEBUG, message));
  }
}

/**
 * Log at INFO level.
 */
export function info(message: string): void {
  if (currentLevel <= LogLevel.INFO) {
    console.log(formatLog(LogLevel.INFO, message));
  }
}

/**
 * Log at WARN level.
 */
export function warn(message: string): void {
  if (currentLevel <= LogLevel.WARN) {
    console.warn(formatLog(LogLevel.WARN, message));
  }
}

/**
 * Log at ERROR level.
 */
export function error(message: string): void {
  if (currentLevel <= LogLevel.ERROR) {
    console.error(formatLog(LogLevel.ERROR, message));
  }
}
