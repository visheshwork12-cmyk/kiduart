import config from '@config/index.js';

export default {
  openapi: '3.0.0',
  info: {
    title: 'School ERP API',
    version: '1.0.0',
    description: 'API for managing School ERP system',
  },
  servers: [
    {
      url: config.env === 'production' ? config.corsOrigin : 'http://localhost:3000',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
    schemas: {
      School: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      Token: {
        type: 'object',
        properties: {
          access: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              expires: { type: 'string', format: 'date-time' },
            },
          },
          refresh: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              expires: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      SystemSettings: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          systemIdentifier: {
            type: 'string',
            description: 'Globally unique identifier for the system (e.g., xAI EduCore v3.0)',
          },
          version: {
            type: 'string',
            description: 'System version in semantic format (e.g., 3.0.1-beta)',
          },
          releaseNotes: {
            type: 'string',
            description: 'Notes describing the current system release',
          },
          operationalMode: {
            type: 'string',
            enum: ['production', 'staging', 'development'],
            description: 'Current operational environment of the system',
          },
          sandboxMode: {
            type: 'boolean',
            description: 'Toggle for isolated testing environment',
          },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'SystemSettings', description: 'System settings management endpoints' },
    { name: 'SuperAdmin-Schools', description: 'Super Admin school management endpoints' },
    { name: 'SuperAdmin-Subscriptions', description: 'Super Admin subscription management endpoints' },
    { name: 'SuperAdmin-Dashboard', description: 'Super Admin dashboard endpoints' },
    { name: 'SuperAdmin-Admins', description: 'Super Admin admin management endpoints' },
    { name: 'Admin-Teachers', description: 'School Admin teacher management endpoints' },
    { name: 'Admin-Students', description: 'School Admin student management endpoints' },
    { name: 'Admin-Exams', description: 'School Admin exam management endpoints' },
    { name: 'Admin-Fees', description: 'School Admin fee management endpoints' },
    { name: 'Admin-Results', description: 'School Admin result management endpoints' },
    { name: 'Health', description: 'Health check endpoints' },
  ],
};