// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const logger = require('../../logger');
// Our authentication middleware
const { authenticate } = require('../../auth');
// Create a router on which to mount our API endpoints
const router = express.Router();

logger.info('Initializing v1 API routes');

// Protect all routes with authentication middleware
logger.info('Applying authentication middleware to v1 API routes');
router.use(authenticate());

// Define our first route, which will be: GET /v1/fragments
logger.info('Setting up route: GET /v1/fragments');
router.get('/fragments', require('./get'));

// Other routes (POST, DELETE, etc.) will go here later...

module.exports = router;
