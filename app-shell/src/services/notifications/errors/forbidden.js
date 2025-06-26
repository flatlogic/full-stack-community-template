const { getNotification, isNotification } = require('../helpers');

module.exports = class ForbiddenError extends Error {
  constructor(messageCode) {
    let message;

    if (messageCode && isNotification(messageCode)) {
      message = getNotification(messageCode);
    }

    message = message || getNotification('errors.forbidden.message');

    super(message);
    this.code = 403;
  }
};
