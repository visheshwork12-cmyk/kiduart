import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import { rateLimit } from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';
import promClient from 'prom-client';
import config from '@config/index.js';
import logger from '@config/logger.js';
import { jwtStrategy } from '@config/passport.js';
import routes from '@api/v1/index.js';
import { errorConverter, errorHandler } from '@middleware/error.middleware.js';
import ApiError from '@utils/apiError.js';
import morgan from '@config/morgan.js';
import { authLimiter, loginLimiter } from '@lib/redis.js';
import versionRoutes from '@api/v1/modules/superadmin/systemSettings/version/version.routes.js';
import apiVersionMiddleware from '@middleware/apiVersion.middleware.js';

const app = express();
const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;

// Prometheus metrics (non-serverless only)
if (!isServerless) {
  const collectDefaultMetrics = promClient.collectDefaultMetrics;
  collectDefaultMetrics({ register: promClient.register });
}

// Logging (non-test, non-serverless)
if (config.env !== 'test' && !isServerless) {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isServerless ? false : undefined,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS
if (config.env === 'production' && !config.corsOrigin) {
  throw new Error('CORS_ORIGIN must be set in production');
}
app.use(cors({
  origin: config.corsOrigin || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));

// Compression
app.use(compression({
  level: isServerless ? 1 : 6,
  threshold: isServerless ? 1024 : 0,
}));

// CSRF
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.jwt.secret,
  cookieName: 'csrf-token',
  cookieOptions: {
    secure: config.env === 'production',
    sameSite: 'strict',
    httpOnly: true,
    maxAge: 3600000,
  },
  getTokenFromRequest: (req) => req.cookies ? req.cookies['csrf-token'] : null,
});

// Health checks and metrics
app.get('/favicon.ico', (req, res) => res.status(204).end());
if (!isServerless) {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
}

// CSRF token generation
app.use((req, res, next) => {
  if (
    req.path.startsWith('/v1/docs') ||
    req.path === '/favicon.ico' ||
    req.path.startsWith('/metrics') ||
    req.path.startsWith('/v1/health') ||
    req.csrfBypass
  ) {
    return next();
  }
  try {
    const csrfToken = generateToken(res, req);
    res.locals.csrfToken = csrfToken;
    res.setHeader('x-csrf-token', csrfToken);
    next();
  } catch (error) {
    logger.error('CSRF Token Generation Error', { message: error.message, stack: error.stack });
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'CSRF token generation failed'));
  }
});

// Authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Routes
app.use('/api', apiVersionMiddleware(['1']), versionRoutes);
app.use('/v1/auth', authLimiter);
app.use('/v1/auth/login', loginLimiter);
app.use('/v1/auth', doubleCsrfProtection);
app.use('/v1/superadmin', doubleCsrfProtection);
app.use('/v1', apiVersionMiddleware(['1']), routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;