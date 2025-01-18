// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Our authentication middleware
const { authenticate } = require('../../auth');

// Protect all routes with authentication middleware
router.use(authenticate());

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));

// Other routes (POST, DELETE, etc.) will go here later...

module.exports = router;
