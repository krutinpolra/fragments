const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment'); // Import Fragment model
const logger = require('../../logger'); // Import logger

const getFragments = async (req, res) => {
  logger.debug(`Get all fragments for user ${req.user}`);
  try {
    const userId = req.user; // Get authenticated user ID
    const { expand } = req.query; // Get query parameter
    logger.info(`Fetching fragments for user: ${userId}, expand: ${expand}`);

    const fragments = await Fragment.byUser(userId, true); // Fetch user's fragments

    if (expand === '1') {
      // ✅ Return full metadata when expand=1
      return res.status(200).json(createSuccessResponse({ fragments }));
    }

    // ✅ Return only fragment IDs if expand is NOT provided
    const fragmentIds = fragments.map((frag) => frag.id);
    return res.status(200).json(createSuccessResponse({ fragments: fragmentIds }));
  } catch (error) {
    logger.error('Error fetching fragments:', error);
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

const splitIDExtension = (id) => {
  const arr = id.split('.');
  const extension = arr[1] ? '.' + arr[1] : null;
  // return extension and ID
  return { fragmentId: arr[0], extension: extension };
};
const mimeType = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

/**
 * Handles GET /fragments/:id requests.
 */
const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  logger.debug(`Fetching fragment with ID: ${id}`);

  const { fragmentId, extension } = splitIDExtension(id);
  const ownerId = req.user;

  try {
    const fragmentMetadata = await Fragment.byId(ownerId, fragmentId);
    logger.debug({ fragmentMetadata }, 'Found fragment metadata');

    const fragment = new Fragment(fragmentMetadata);
    const fragmentData = await fragment.getData();

    // ✅ If an extension is provided, try converting the fragment
    if (extension) {
      if (!mimeType[extension]) {
        logger.warn(`Unsupported conversion extension: ${extension}`);
        return res.status(415).json(createErrorResponse(415, 'Unsupported conversion extension'));
      }

      if (!fragment.formats.includes(mimeType[extension])) {
        logger.warn(`Cannot convert fragment to ${extension}`);
        return res
          .status(415)
          .json(
            createErrorResponse(
              415,
              `The fragment cannot be converted into the extension specified!`
            )
          );
      }

      // Convert the fragment into the requested format
      const convertedData = await fragment.getConvertedInto(extension);
      res.status(200).type(mimeType[extension]).send(convertedData);
      return;
    }

    // ✅ If it's binary data, return raw binary content
    if (!fragment.isText) {
      logger.info(`Returning raw binary data for fragment ${fragmentId}`);
      res.set('Content-Type', fragment.mimeType);
      return res.status(200).send(fragmentData);
    }

    // ✅ Otherwise, return the fragment as JSON with content
    res.status(200).json(
      createSuccessResponse({
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
      })
    );
  } catch (error) {
    logger.error(`Fragment with ID ${fragmentId} not found. Error: ${error}`);
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${fragmentId} found`));
  }
};

const getFragmentInfo = async (req, res) => {
  const { id } = req.params;
  logger.debug(`Fetching full fragment info for ID: ${id}`);

  const ownerId = req.user;

  try {
    const fragmentMetadata = await Fragment.byId(ownerId, id);
    const fragment = new Fragment(fragmentMetadata);

    // ✅ Include fragment content
    return res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
  } catch (error) {
    logger.error(`Fragment with ID ${id} not found. Error: ${error}`);
    return res.status(404).json(createErrorResponse(404, `No fragment with ID ${id} found`));
  }
};

/**
 * Get a list of fragments for the current user
 */
module.exports = {
  getFragments,
  getFragmentByID,
  getFragmentInfo,
};
