const nodemailer = require('nodemailer');
const isEmail = require('validator/lib/isEmail');
const config = require('../config');
const ValidationError = require('../services/notifications/errors/validation');

function normalizeEmail(address) {
  if (typeof address !== 'string' || !isEmail(address.trim(), { allow_utf8_local_part: false })) {
    throw new ValidationError('auth.invalidEmail');
  }
  return address.trim().toLowerCase();
}

function frontendOrigin() {
  const development = !process.env.NODE_ENV || ['development', 'test'].includes(process.env.NODE_ENV);
  const domain = process.env.FULL_DOMAIN || process.env.HOST_FQDN;
  const api = process.env.NEXT_PUBLIC_BACK_API;
  let address = process.env.FRONTEND_ORIGIN;
  if (!address && domain) {
    if (!/^[a-z0-9.-]+$/i.test(domain)) {
      throw new Error('Invalid application domain for account email');
    }
    address = 'https://' + domain;
  }
  if (!address && api && /^https?:\/\//i.test(api)) {
    address = api;
  }
  if (!address && development) {
    address = 'http://localhost:3000';
  }
  if (!address) {
    throw new Error('Configure FRONTEND_ORIGIN to send account email');
  }
  const url = new URL(address);
  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid frontend origin for account email');
  }
  return url.origin;
}

async function sendAccountEmail(email, purpose, token) {
  const verify = purpose === 'verification';
  const invite = purpose === 'invitation';
  const link = new URL(verify ? '/verify-email' : '/password-reset', frontendOrigin());
  const fragment = new URLSearchParams({ token });
  if (invite) {
    fragment.set('invitation', '1');
  }
  link.hash = fragment.toString();
  const subject = verify ? 'Verify your email address' : invite ? 'Set up your account' : 'Reset your password';
  const { from, ...smtp } = config.email;
  try {
    await nodemailer.createTransport(smtp).sendMail({
      from,
      to: { address: email, name: '' },
      subject,
      text: [subject, link.href, 'This link expires in one hour. If you did not request this email, you can ignore it.'].join('\n\n'),
    });
  } catch (error) {
    // SMTP responses may contain a recipient or message. Expose only the failure class.
    console.error('Account email delivery failed', error.code || 'SMTP');
    throw new Error('Account email could not be delivered');
  }
}

module.exports = { normalizeEmail, sendAccountEmail };
