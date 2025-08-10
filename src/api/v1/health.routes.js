import express from 'express';
import mongoose from 'mongoose';
import redis from '@lib/redis.js';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    db: dbStatus,
    uptime: process.uptime(),
  });
});

router.get('/test-cookies', (req, res) => {
  res.cookie('test-cookie', 'test-value', { httpOnly: true });
  res.json({ cookies: req.cookies });
});

router.get('/redis', async (req, res) => {
  try {
    const isHealthy = await redis.isHealthy();
    if (isHealthy) {
      res.json({ status: 'healthy', redis: 'connected' });
    } else {
      res.status(503).json({ status: 'unhealthy', redis: 'disconnected' });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      redis: 'error',
      message: error.message 
    });
  }
});

export default router;