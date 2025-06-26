const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = class Helpers {
  static wrapAsync(fn) {
    return function (req, res, next) {
      fn(req, res, next).catch(next);
    };
  }

  static commonErrorHandler(error, req, res, next) {
    if ([400, 403, 404].includes(error.code)) {
      return res.status(error.code).send(error.message);
    }

    console.error(error);
    return res.status(500).send(error.message);
  }

  static jwtSign(data) {
    return jwt.sign(data, config.secret_key, { expiresIn: '6h' });
  }
};
