const _get = require('lodash/get');
const errors = require('./list');

function format(message, args) {
  if (!message) {
    return null;
  }

  return message.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
}

const isNotification = (key) => {
  const message = _get(errors, key);
  return !!message;
};

const getNotification = (key, ...args) => {
  const message = _get(errors, key);

  if (!message) {
    return key;
  }

  return format(message, args);
};

exports.getNotification = getNotification;
exports.isNotification = isNotification;
