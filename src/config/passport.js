import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import config from './index.js';
import tokens from './tokens.js';
import AdminModel from '@models/superadmin/admin.model.js';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokens.ACCESS) {
      throw new Error('Invalid token type');
    }
    const admin = await AdminModel.findById(payload.sub);
    if (!admin) {
      return done(null, false);
    }
    done(null, admin);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export { jwtStrategy };