import pino from 'pino';
import * as Sentry from '@sentry/node';
import metrics from 'datadog-metrics';

// Initialize Datadog only if DATADOG_API_KEY is set
let datadogInitialized = false;
if (process.env.DATADOG_API_KEY) {
  try {
    metrics.init({ apiKey: process.env.DATADOG_API_KEY });
    datadogInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Datadog metrics', { message: error.message });
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.VERCEL ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true },
  },
  redact: ['password', 'twoFactorSecret'],
  base: {
    pid: process.pid,
    hostname: process.env.VERCEL ? 'vercel' : undefined,
  },
});

// Integrate with Sentry and Datadog for production logging/monitoring
logger.on('error', (err) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  if (datadogInitialized) {
    metrics.increment('error.count');
  }
});

export default logger;