import winston from "winston";
import config from "./config";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      const truncatedMeta = JSON.stringify(metadata).substring(0, 500);
      msg += ` ${truncatedMeta}`;
    }

    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  }
);

export const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  defaultMeta: { service: "comoencasa-api" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 2097152,
      maxFiles: 3,
      tailable: true,
      zippedArchive: true,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 3145728,
      maxFiles: 2,
      tailable: true,
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

if (config.NODE_ENV === "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
      level: "warn",
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    })
  );
}

export const secureLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    if (config.NODE_ENV === "production" && shouldThrottle("info")) {
      return;
    }
    logger.info(message, sanitizeMetadata(meta));
  },

  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, sanitizeMetadata(meta));
  },

  error: (message: string, error?: unknown, meta?: Record<string, any>) => {
    const sanitizedMeta = sanitizeMetadata(meta);

    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        stack: config.NODE_ENV !== "production" ? error.stack : undefined,
        ...sanitizedMeta,
      });
    } else {
      logger.error(message, {
        error: "Unknown error",
        ...sanitizedMeta,
      });
    }
  },

  debug: (message: string, meta?: Record<string, any>) => {
    if (config.NODE_ENV !== "production") {
      logger.debug(message, sanitizeMetadata(meta));
    }
  },
};

const logThrottleMap = new Map<string, number>();
const THROTTLE_INTERVAL = 1000;

function shouldThrottle(level: string): boolean {
  const now = Date.now();
  const lastLog = logThrottleMap.get(level) || 0;

  if (now - lastLog < THROTTLE_INTERVAL) {
    return true;
  }

  logThrottleMap.set(level, now);
  return false;
}

function sanitizeMetadata(meta?: Record<string, any>): Record<string, any> {
  if (!meta) return {};

  const sanitized = { ...meta };
  const sensitiveKeys = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "session",
    "jwt",
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "***REDACTED***";
    }

    if (typeof sanitized[key] === "string" && sanitized[key].length > 200) {
      sanitized[key] = sanitized[key].substring(0, 200) + "...";
    }

    if (Array.isArray(sanitized[key]) && sanitized[key].length > 10) {
      sanitized[key] = sanitized[key].slice(0, 10);
    }
  }

  return sanitized;
}

setInterval(() => {
  logThrottleMap.clear();
}, 300000);

export default logger;
