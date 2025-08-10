import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerDefinition from '@docs/swaggerDef.js';
import basicAuthMiddleware from '@middleware/basicAuth.middleware.js';
import { rateLimit } from 'express-rate-limit';
import config from '@config/index.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: [
    path.join(__dirname, '@docs/*.yml'),
    path.join(__dirname, './*.js'),
    path.join(__dirname, './modules/superadmin/**/*.js'),
    path.join(__dirname, './auth/*.js'),
  ],
});

router.use('/swagger-ui', express.static(path.join(__dirname, '../../../node_modules/swagger-ui-dist')));

if (config.env === 'production') {
  router.use(basicAuthMiddleware);
  router.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: { code: 429, message: 'Too many requests to Swagger UI, please try again later.' },
    })
  );
}

router.use('/', (req, res, next) => {
  req.csrfBypass = true;
  next();
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    preauthorizeApiKey: {
      basicAuth: {
        authType: 'basic',
        username: config.auth.basicAuthUsername,
        password: config.auth.basicAuthPassword,
      },
    },
    security: [{ basicAuth: [] }],
  },
}));

router.get('/json', (req, res) => {
  res.json(specs);
});

export default router;