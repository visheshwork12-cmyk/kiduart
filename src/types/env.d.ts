declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'production' | 'development' | 'test';
      PORT: string;
      MONGODB_URL: string;
      JWT_SECRET: string;
      JWT_ACCESS_EXPIRATION_MINUTES: string;
      JWT_REFRESH_EXPIRATION_DAYS: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USERNAME: string;
      SMTP_PASSWORD: string;
      EMAIL_FROM: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      BASIC_AUTH_USERNAME: string;
      BASIC_AUTH_PASSWORD: string;
      REDIS_URL: string;
      LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
      VERCEL_URL: string;
      CORS_ORIGIN: string;
    }
  }