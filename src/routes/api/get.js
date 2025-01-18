// src/routes/api/get.js

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  const placeholderFragments = [];

  // Simulate fetching fragments for the current user
  const userId = req.user?.id || 'user123'; // we will Replace it with actual user ID extraction logic
  const userFragments = placeholderFragments.filter((fragment) => fragment.ownerId === userId);

  res.status(200).json({
    status: 'ok',
    // TODO: change me
    fragments: userFragments,
  });
};
