const config = require('../config');

const passport = require('passport');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const UsersDBApi = require('../db/api/users');


passport.use(new JWTstrategy({
  passReqToCallback: true,
  secretOrKey: config.secret_key,
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
}, async (req, token, done) => {
  try {
    const user = await UsersDBApi.findBy( {email: token.user.email});

    if (user && user.disabled) {
      return done (new Error(`User '${user.email}' is disabled`));
    }

    req.currentUser = user;

    return done(null, user);
  } catch (error) {
    done(error);
  }
}));