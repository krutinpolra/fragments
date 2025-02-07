// src/auth/basic-auth.js

// Configure HTTP Basic Auth strategy for Passport, see:
// https://github.com/http-auth/http-auth-passport

const auth = require('http-auth');
const passport = require('passport');
const authPassport = require('http-auth-passport');

const logger = require('../logger');

// We expect HTPASSWD_FILE to be defined.
if (!process.env.HTPASSWD_FILE) {
  logger.error('Missing expected env var: HTPASSWD_FILE');
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

// Log that we're using Basic Auth
logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () =>
  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  logger.info('Setting up Basic Auth strategy');
authPassport(
  auth.basic({
    file: process.env.HTPASSWD_FILE,
  })
);

module.exports.authenticate = () => {
  return (req, res, next) => {
    passport.authenticate('http', { session: false }, (err, user) => {
      if (err) {
        logger.error('Authentication error', err);
        return res
          .status(500)
          .json({ status: 'error', error: { code: 500, message: 'Authentication error' } });
      }
      if (!user) {
        logger.warn('Unauthorized access attempt');
        return res
          .status(401)
          .json({ status: 'error', error: { code: 401, message: 'Unauthorized' } });
      }
      req.user = user;
      logger.debug(`User authenticated: ${user.email}`);
      next();
    })(req, res, next);
  };
};
