import express from 'express';
import logger from './config/logger.js';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { initializeServices, cleanup } from './index.js';
import { connectToDatabase, warmupMongo, disconnect } from './lib/mongodb.js';
import { redisManager } from './lib/redis.js';
import packageJson from '../package.json' with { type: 'json' };

const app = express();

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}


app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.VERCEL ? 200 : 100,
  message: 'Too many requests, please try again later.'
}));
app.use(express.json({ limit: '10kb' }));


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School ERP Backend API',
      version: packageJson.version,
      description: 'API documentation for School ERP',
    },
    servers: [{ url: process.env.VERCEL_URL || 'http://localhost:4000' }],
  },
  apis: ['./src/api/**/*.js'],
};
const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.get('/api-docs/swagger.json', (req, res) => res.json(swaggerSpecs));


app.get('/api/version', (req, res) => {
  res.json({ version: packageJson.version });
});

app.use((err, req, res, next) => {
  logger.error('Error occurred', { error: err.message, stack: err.stack });
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({ message: 'An error occurred', code: err.code || 'SERVER_ERROR' });
  } else {
    res.status(err.status || 500).json({ message: err.message, stack: err.stack });
  }
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
});

// Serverless flag
const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;

// Initialize services for serverless
let servicesInitialized = false;

const ensureServicesInitialized = async () => {
  if (!servicesInitialized) {
    await initializeServices();
    servicesInitialized = true;
    logger.info('Services initialized for environment', { isServerless });
  }
};

// Serverless handler
const serverlessHandler = async (req, res) => {
  try {
    await ensureServicesInitialized();
    return app.handle(req, res);
  } catch (error) {
    logger.error('Serverless handler error', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export for serverless compatibility
export default isServerless ? serverlessHandler : app;

// Local server for development
if (!isServerless) {
  const port = process.env.PORT || 4000;
  const startLocalServer = async () => {
    try {
      await ensureServicesInitialized();
      await warmupMongo();
      await redisManager.warmup();

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
          await disconnect();
          await redisManager.disconnect();
          logger.info('Server shutdown complete');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGUSR2', async () => {
        logger.info('Nodemon restart - cleaning up');
        await cleanup();
        await disconnect();
        await redisManager.disconnect();
        process.kill(process.pid, 'SIGUSR2');
      });
    } catch (error) {
      logger.error('Failed to start local server', { message: error.message, stack: error.stack });
      process.exit(1);
    }
  };

  startLocalServer();
}