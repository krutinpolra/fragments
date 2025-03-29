const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment'); // Import Fragment model
const logger = require('../../logger'); // Import logger

const getFragments = async (req, res) => {
  logger.debug(`Get all fragments for user ${req.user}`);
  try {
    const userId = req.user;
    const { expand } = req.query;
    const includeMetadata = expand === '1';

    logger.info(`Fetching fragments for user: ${userId}, expand: ${expand}`);

    const fragments = await Fragment.byUser(userId, includeMetadata);

    if (includeMetadata) {
      logger.info(`Returning full fragment metadata.`);
      return res.status(200).json(createSuccessResponse({ fragments }));
    }
    logger.debug(`Raw fragments from byUser():`, fragments);

    const fragmentIds = fragments.map((frag) =>
      typeof frag === 'object' && frag !== null ? frag.id : frag
    );
    logger.info(`Returning only fragment IDs.: ${fragmentIds}`);
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
    const fragment = new Fragment(fragmentMetadata);
    const fragmentData = await fragment.getData();

    // If an extension is provided, try converting the fragment
    if (extension) {
      if (!mimeType[extension]) {
        return res.status(415).json(createErrorResponse(415, 'Unsupported conversion extension'));
      }

      if (!fragment.formats.includes(mimeType[extension])) {
        return res
          .status(415)
          .json(
            createErrorResponse(
              415,
              `The fragment cannot be converted into the extension specified!`
            )
          );
      }

      const convertedData = await fragment.getConvertedInto(extension);
      return res.status(200).type(mimeType[extension]).send(convertedData);
    }

    // Always return raw fragment content, no metadata here
    logger.info(`Returning raw content for fragment ${fragmentId}`);
    res.set('Content-Type', fragment.mimeType);
    return res.status(200).send(fragmentData);
  } catch (error) {
    logger.error(`Fragment with ID ${fragmentId} not found. Error: ${error}`);
    return res
      .status(404)
      .json(createErrorResponse(404, `No fragment with ID ${fragmentId} found`));
  }
};

const getFragmentInfo = async (req, res) => {
  const { id } = req.params;
  logger.debug(`Fetching full fragment info for ID: ${id}`);

  // Fix: Ensure ownerId is a string (hashed email), not a user object
  const ownerId = typeof req.user === 'string' ? req.user : req.user?.sub;
  logger.debug(`Resolved ownerId for /info: ${ownerId}`);

  try {
    const fragmentMetadata = await Fragment.byId(ownerId, id);
    const fragment = new Fragment(fragmentMetadata);

    // Return fragment metadata
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
