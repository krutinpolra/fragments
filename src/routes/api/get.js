const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment'); // Import Fragment model
const logger = require('../../logger'); // Import logger
const path = require('path');

const getFragments = async (req, res) => {
  logger.debug(`Get all fragments for user ${req.user}`);
  try {
    const userId = req.user; // Get authenticated user ID
    const { expand } = req.query; // Get query parameter
    logger.info(`Fetching fragments for user: ${userId}, expand: ${expand}`);

    const fragments = await Fragment.byUser(userId, true); // Fetch user's fragments

    if (expand === '1') {
      // Fetch and include content if expand=1
      return res.status(200).json(createSuccessResponse({ fragments }));
    }

    logger.info(`Returning fragment metadata for user ${userId}`);
    return res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error('Error fetching fragments:', error);
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

const splitIDExtension = (id) => {
  const { name: fragmentId, ext: extension } = path.parse(id);
  logger.debug(`Parsed ID: ${fragmentId}, Extension: ${extension || 'None'}`);
  return { fragmentId, extension: extension || null };
};

const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  const { expand } = req.query; // Check if expand=1 is provided
  let { fragmentId } = splitIDExtension(id);
  const ownerId = req.user;

  try {
    // ✅ Now `byId()` handles conversion, so we don't need extra conversion here
    const fragment = await Fragment.byId(ownerId, fragmentId);

    // ✅ If the fragment is binary, return raw data with correct Content-Type
    if (!fragment.isText) {
      logger.info(`Returning raw binary data for fragment ${fragmentId}`);
      res.set('Content-Type', fragment.type);
      return res.status(200).send(fragment.content);
    }

    // ✅ If expand=1, return full content in JSON
    if (expand === '1') {
      return res.status(200).json(createSuccessResponse({ fragment }));
    }

    // ✅ Default case: Return metadata without full content
    return res.status(200).json(
      createSuccessResponse({
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
      })
    );
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return res
      .status(404)
      .json(createErrorResponse(404, `No fragment with ID ${fragmentId} found`));
  }
};

/**
 * Get a list of fragments for the current user
 */
module.exports = {
  getFragments,
  getFragmentByID,
};
