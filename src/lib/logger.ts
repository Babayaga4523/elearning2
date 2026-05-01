/**
 * Production-Grade Logging System
 * Uses Winston for structured logging with multiple transports
 * Supports different log levels and formats for development/production
 */

import winston from "winston";
import { env } from "@/lib/env";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define development format (colorized and pretty)
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define transports
const transports: winston.transport[] = [];

// Console transport (always enabled)
if (env.NODE_ENV === "development") {
  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: format,
    })
  );
}

// File transports (production only)
if (env.NODE_ENV === "production") {
  // All logs
  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log",
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Error logs only
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format,
  transports,
  exitOnError: false,
});

// Helper functions for structured logging
export const log = {
  /**
   * Log error with context
   */
  error: (message: string, meta?: Record<string, any>) => {
    logger.error(message, meta);
  },

  /**
   * Log warning with context
   */
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  /**
   * Log info with context
   */
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  /**
   * Log HTTP request
   */
  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, meta);
  },

  /**
   * Log debug information (development only)
   */
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  /**
   * Log security event
   */
  security: (message: string, meta?: Record<string, any>) => {
    logger.warn(`[SECURITY] ${message}`, {
      ...meta,
      type: "security",
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log database operation
   */
  database: (message: string, meta?: Record<string, any>) => {
    logger.info(`[DATABASE] ${message}`, {
      ...meta,
      type: "database",
    });
  },

  /**
   * Log authentication event
   */
  auth: (message: string, meta?: Record<string, any>) => {
    logger.info(`[AUTH] ${message}`, {
      ...meta,
      type: "auth",
    });
  },

  /**
   * Log API request/response
   */
  api: (message: string, meta?: Record<string, any>) => {
    logger.http(`[API] ${message}`, {
      ...meta,
      type: "api",
    });
  },

  /**
   * Log scheduler job
   */
  scheduler: (message: string, meta?: Record<string, any>) => {
    logger.info(`[SCHEDULER] ${message}`, {
      ...meta,
      type: "scheduler",
    });
  },

  /**
   * Log email operation
   */
  email: (message: string, meta?: Record<string, any>) => {
    logger.info(`[EMAIL] ${message}`, {
      ...meta,
      type: "email",
    });
  },
};

// Export logger instance for advanced usage
export default logger;

// Stream for Morgan HTTP logger (if needed)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
