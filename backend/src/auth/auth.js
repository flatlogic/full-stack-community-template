const config = require('../config');

const passport = require('passport');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const UsersDBApi = require('../db/api/users');
const { normalizeEmail } = require('./email');


passport.use(new JWTstrategy({
  passReqToCallback: true,
  secretOrKey: config.secret_key,
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
}, async (req, token, done) => {
  try {
    const user = await UsersDBApi.findBy({ id: token.user.id, email: normalizeEmail(token.user.email) });

    if (!user || user.disabled || !user.emailVerified) {
      return done(null, false);
    }

    req.currentUser = user;

    return done(null, user);
  } catch (error) {
    done(error);
  }
}));