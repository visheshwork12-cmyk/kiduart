import Joi from 'joi';
import zxcvbn from 'zxcvbn';

const password = (value, helpers) => {
  const result = zxcvbn(value);
  if (result.score < 3) {
    return helpers.message('Password is too weak. Please use a stronger password.');
  }
  if (value.length < 8) {
    return helpers.message('Password must be at least 8 characters long.');
  }
  return value;
};

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('Invalid ObjectId.');
  }
  return value;
};

export { password, objectId };