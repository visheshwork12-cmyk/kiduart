import morgan from 'morgan';
import logger from './logger.js';

const stream = {
  write: (message) => logger.info(message.trim()),
};

const successHandler = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream,
    skip: (req, res) => res.statusCode >= 400,
  }
);

const errorHandler = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream,
    skip: (req, res) => res.statusCode < 400,
  }
);

export default { successHandler, errorHandler };