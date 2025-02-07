// src/routes/api/get.js
const { createSuccessResponse } = require('../../response'); // Import response helper
const logger = require('../../logger'); // Import logger
/**
 * Get a list of fragments for the current user
 */

module.exports = (req, res) => {
  logger.info(`Fetching fragments for user: ${req.user?.email || 'unknown'}`);
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json(
    createSuccessResponse({
      fragments: [], // Placeholder, to be replaced with actual data later
    })
  );
};
