# School ERP Backend

## Vercel Deployment Guide

- **Environment Variables**: Set `MONGODB_URL`, `REDIS_URL`, `SENTRY_DSN`, `DATADOG_API_KEY`, `ALLOWED_ORIGINS` in Vercel dashboard.
- **Deployment**: Push to GitHub and link to Vercel. Use `vercel.json` for configuration.
- **Troubleshooting**: Check logs in Vercel dashboard. For connection issues, ensure pooling is enabled.
- **Monitoring**: Errors are sent to Sentry; metrics to Datadog. Set up alerts in their dashboards.

## API Documentation

Access Swagger docs at `/api-docs` after deployment.