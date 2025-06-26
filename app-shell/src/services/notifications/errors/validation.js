const { getNotification, isNotification } = require('../helpers');

module.exports = class ValidationError extends Error {
  constructor(messageCode) {
    let message;

    if (messageCode && isNotification(messageCode)) {
      message = getNotification(messageCode);
    }

    message = message || getNotification('errors.validation.message');

    super(message);
    this.code = 400;
  }
};
