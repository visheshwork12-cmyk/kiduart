import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Joi from 'joi';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file
const envFile = `.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`;
const envFilePath = path.resolve(__dirname, '../../', envFile);
const dotenvResult = dotenv.config({ path: envFilePath });

if (dotenvResult.error) {
  logger.warn(`Failed to load ${envFile}, falling back to .env`);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('MongoDB connection URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('Minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('Days after which refresh tokens expire'),
    SMTP_HOST: Joi.string().required().description('Server that will send the emails'),
    SMTP_PORT: Joi.number().required().description('Port to connect to the email server'),
    SMTP_USERNAME: Joi.string().required().description('Username for email server'),
    SMTP_PASSWORD: Joi.string().required().description('Password for email server'),
    EMAIL_FROM: Joi.string().required().description('The from field in the emails sent by the app'),
    CLOUDINARY_CLOUD_NAME: Joi.string().required().description('Cloudinary cloud name'),
    CLOUDINARY_API_KEY: Joi.string().required().description('Cloudinary API key'),
    CLOUDINARY_API_SECRET: Joi.string().required().description('Cloudinary API secret'),
    BASIC_AUTH_USERNAME: Joi.string().required().description('Basic auth username'),
    BASIC_AUTH_PASSWORD: Joi.string().required().description('Basic auth password'),
    REDIS_URL: Joi.string().required().description('Redis connection URL'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    VERCEL_URL: Joi.string().default('http://localhost:3000').description('Vercel deployment URL'),
    CORS_ORIGIN: Joi.string().required().description('CORS allowed origins'),
    STRIPE_SECRET_KEY: Joi.string().required().description('Stripe secret key'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

console.log('MONGODB_URL:', envVars.MONGODB_URL);

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5,
      minPoolSize: 1,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000,
      ssl: envVars.MONGODB_URL.includes('mongodb+srv://'), // Enable SSL for Atlas
    },
  },
  auth: {
    basicAuthUsername: envVars.BASIC_AUTH_USERNAME,
    basicAuthPassword: envVars.BASIC_AUTH_PASSWORD,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: 10,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  redis: {
    url: envVars.REDIS_URL || 'redis://localhost:6379',
    tls: envVars.REDIS_TLS === 'true',
    rejectUnauthorized: envVars.REDIS_REJECT_UNAUTHORIZED === 'false' || false,
    maxRetries: parseInt(envVars.REDIS_MAX_RETRIES) || 10,
    retryDelay: parseInt(envVars.REDIS_RETRY_DELAY) || 1000,
  },
  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
  },
  logLevel: envVars.LOG_LEVEL,
  vercelUrl: envVars.VERCEL_URL,
  corsOrigin: envVars.CORS_ORIGIN,
};