import express from 'express';
import logger from '@config/logger.js';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { initializeServices, cleanup } from './index.js'; // Modified: Use @src alias to match jsconfig.json
import { connectToDatabase, warmupMongo, disconnect } from '@lib/mongodb.js'; // Modified: Import warmupMongo correctly
import { redisManager } from '@lib/redis.js';
import packageJson from '../package.json' with { type: 'json' }; // Use `with` for JSON import in Node.js v22.15.0

// Initialize Express app
const app = express();

// New: Initialize Sentry for error monitoring if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

// New: Security enhancements
app.use(helmet()); // Adds security headers
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins })); // Restrict CORS origins for production
app.use(rateLimit({ // Add rate limiting to prevent abuse
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.VERCEL ? 200 : 100, // Higher limit for serverless
  message: 'Too many requests, please try again later.'
}));
app.use(express.json({ limit: '10kb' })); // Add request size limit for security

// New: Swagger API documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School ERP Backend API',
      version: packageJson.version,
      description: 'API documentation for School ERP',
    },
  },
  apis: ['./src/api/**/*.js'], // Scan for JSDoc comments in API files
};
const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs)); // Serve Swagger UI at /api-docs

// New: Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: packageJson.version }); // Returns version from package.json
});

// New: Error handling middleware (production-safe)
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Hide sensitive info in production
    res.status(err.status || 500).json({ message: 'An error occurred', code: err.code || 'SERVER_ERROR' });
  } else {
    res.status(err.status || 500).json({ message: err.message, stack: err.stack });
  }
  Sentry.captureException(err); // Capture errors to Sentry
  logger.error('Error occurred', { error: err.message, stack: err.stack });
});

// Serverless flag
const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;

// Initialize services for serverless
let servicesInitialized = false;

// Modified: Ensure services are initialized for both serverless and local
const ensureServicesInitialized = async () => {
  if (!servicesInitialized) {
    await initializeServices();
    servicesInitialized = true;
    logger.info('Services initialized for environment', { isServerless });
  }
};

// Modified: Create serverless handler
const serverlessHandler = async (req, res) => {
  try {
    await ensureServicesInitialized();
    return app.handle(req, res); // Use Express app.handle for serverless
  } catch (error) {
    logger.error('Serverless handler error', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Modified: Export at top level for serverless compatibility
export default isServerless ? serverlessHandler : app;

// Local server for development/custom environments
if (!isServerless) {
  const port = process.env.PORT || 4000;
  const startLocalServer = async () => {
    try {
      await ensureServicesInitialized();
      await warmupMongo(); // Warmup MongoDB connection
      await redisManager.warmup(); // Warmup Redis connection

      const server = app.listen(port, () => {
        logger.info(`🚀 Server running locally on http://localhost:${port}`);
        logger.info(`📚 Documentation: http://localhost:${port}/api-docs`);
        logger.info(`🏥 Health check: http://localhost:${port}/v1/health`);
      });

      // Graceful shutdown
      const shutdown = async (signal) => {
        logger.info(`${signal} received, shutting down gracefully`);
        server.close(async () => {
          await cleanup();
          await disconnect(); // New: Ensure MongoDB disconnects on shutdown
          await redisManager.disconnect(); // New: Ensure Redis disconnects on shutdown
          logger.info('Server shutdown complete');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGUSR2', async () => {
        logger.info('Nodemon restart - cleaning up');
        await cleanup();
        await disconnect(); // New: Ensure MongoDB disconnects on nodemon restart
        await redisManager.disconnect(); // New: Ensure Redis disconnects on nodemon restart
        process.kill(process.pid, 'SIGUSR2');
      });
    } catch (error) {
      logger.error('Failed to start local server', { message: error.message, stack: error.stack });
      process.exit(1);
    }
  };

  startLocalServer();
}