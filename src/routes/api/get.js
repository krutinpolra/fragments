// src/routes/api/get.js
const { createSuccessResponse } = require('../../response'); // Import response helper
/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json(
    createSuccessResponse({
      fragments: [], // Placeholder, to be replaced with actual data later
    })
  );
};
