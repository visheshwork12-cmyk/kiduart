import nodemailer from 'nodemailer';
import net from 'net';
import redis from 'redis';
import ApiError from './apiError.js';
import httpStatus from 'http-status';

const validateSMTPServer = async (host, port) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      reject(new ApiError(httpStatus.BAD_REQUEST, 'SMTP server timeout'));
    });
    socket.on('error', () => {
      socket.destroy();
      reject(new ApiError(httpStatus.BAD_REQUEST, 'Invalid SMTP server'));
    });
    socket.connect(port, host);
  });
};

const validateRedis = async (host, port) => {
  const client = redis.createClient({ url: `redis://${host}:${port}` });
  try {
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Redis configuration');
  }
};

const liveValidation = async (config) => {
  if (config.authenticationStack?.email?.enabled) {
    await validateSMTPServer(config.authenticationStack.email.smtpServer, config.authenticationStack.email.smtpPort);
  }
  if (config.cache?.enabled) {
    await validateRedis(config.cache.host, config.cache.port);
  }
  return true;
};

export default liveValidation;