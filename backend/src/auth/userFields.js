const privateUserFields = [
  'password',
  'authenticationUid',
  'passwordResetToken',
  'passwordResetTokenExpiresAt',
  'emailVerificationToken',
  'emailVerificationTokenExpiresAt',
  'provider',
];

function publicUserFields(fields) {
  return fields.filter(field => !privateUserFields.includes(field));
}

module.exports = { privateUserFields, publicUserFields };
