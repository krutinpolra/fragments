// src/app.js
const logger = require('./logger');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const authenticate = require('./auth');
const passport = require('passport');
const { createErrorResponse } = require('./response'); // Import response helper

// Create an express app instance we can use to attach middleware and HTTP routes
const app = express();

logger.info('Initializing Express app');

// Use CORS middleware so we can make requests across origins
app.use(cors());
logger.info('CORS middleware enabled');

logger.info('Setting up API routes');
// Define our routes
app.use('/', require('./routes'));

// author and version from our package.json file
// TODO: make sure you have updated your name in the `author` section
//const { author, version } = require('../package.json');

const pino = require('pino-http')({
  // Use our default logger instance, which is already configured
  logger,
});

// Use gzip/deflate compression middleware
app.use(compression());
logger.info('Compression middleware enabled');

// Use pino logging middleware
app.use(pino);
logger.info('Pino logging middleware enabled');

// Use helmetjs security middleware
app.use(helmet());
logger.info('Helmet security middleware enabled');

// Set up our passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());
logger.info('Passport authentication initialized');

// Define a simple health check route. If the server is running
// we'll respond with a 200 OK.  If not, the server isn't healthy.
/*app.get('/', (req, res) => {
  // Clients shouldn't cache this response (always request it fresh)
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#controlling_caching
  res.setHeader('Cache-Control', 'no-cache');

  // Send a 200 'OK' response with info about our repo
  res.status(200).json({
    status: 'ok',
    author,
    // TODO: change this to use your GitHub username!
    githubUrl: 'https://github.com/krutinpolra/fragments.git',
    version,
  });
});*/

// Add 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Add error-handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // We may already have an error response we can use, but if not,
  // use a generic `500` server error and message.
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  // If this is a server error, log something so we can see what's going on.
  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  } else {
    logger.warn({ err }, `Client error on request: ${req.originalUrl}`);
  }

  res.status(status).json(createErrorResponse(status, message));
});

logger.info('Express app successfully initialized');
// Export our `app` so we can access it in server.js
module.exports = app;
