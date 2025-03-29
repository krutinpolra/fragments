// src/routes/index.js

const express = require('express');

const { hostname } = require('os');

// version and author from package.json
const { version, author } = require('../../package.json');

// Import response helper
const { createSuccessResponse } = require('../../src/response');

// Create a router that we can use to mount our API
const router = express.Router();

// Our authentication middleware
const { authenticate } = require('../auth');

// Define a simple health check route. If the server is running
// we'll respond with a 200 OK.  If not, the server isn't healthy.
router.get('/', (req, res) => {
  // Clients shouldn't cache this response (always request it fresh)
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#controlling_caching
  res.setHeader('Cache-Control', 'no-cache');

  // Send a 200 'OK' response with info about our repo
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl: 'https://github.com/krutinpolra/fragments.git',
      version,
      hostname: hostname(),
    })
  );
});

/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all with middleware so you have to be authenticated
 * in order to access things.
 */
router.use(`/v1`, authenticate(), require('./api'));

module.exports = router;
