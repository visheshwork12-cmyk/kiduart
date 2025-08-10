import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '@utils/apiError.js';
import CONSTANT from '@config/constants.js';

const authMiddleware = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || !user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, CONSTANT.NO_TOKEN));
    }
    req.user = user;
    next();
  })(req, res, next);
};

export default authMiddleware;