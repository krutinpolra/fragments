const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment'); // Import Fragment model
const logger = require('../../logger'); // Import logger

const getFragments = async (req, res) => {
  logger.debug(`Get all fragment for user ${req.user}`);
  try {
    const userId = req.user; // Get authenticated user ID
    console.log(`Fetching fragments for user: ${userId}`);

    const fragments = await Fragment.byUser(userId, true); // Fetch user's fragments
    logger.info(`Found ${fragments.length} fragments for user ${userId}`);

    res.status(200).json(createSuccessResponse({ fragments })); // Return fragments
  } catch (error) {
    console.error('Error fetching fragments:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const splitIDExtension = (id) => {
  const arr = id.split('.');
  const extension = arr[1] ? '.' + arr[1] : null;
  // return extension and ID
  return { fragmentId: arr[0], extension: extension };
};

const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  const { expand } = req.query; // Check if expand=1 is provided
  let { fragmentId } = splitIDExtension(id);
  const ownerId = req.user;

  try {
    const fragmentMetadata = await Fragment.byId(ownerId, fragmentId);
    const fragment = new Fragment(fragmentMetadata);
    const fragmentData = await fragment.getData();

    // ✅ Ensure response is always in JSON format
    if (expand === '1') {
      return res.status(200).json(
        createSuccessResponse({
          fragment: {
            ...fragmentMetadata,
            content: fragment.isText ? fragmentData.toString() : '[Binary Data]',
          },
        })
      );
    }

    // ✅ If not expanding, return JSON instead of raw text
    return res.status(200).json(
      createSuccessResponse({
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
        content: fragment.isText ? fragmentData.toString() : '[Binary Data]',
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
