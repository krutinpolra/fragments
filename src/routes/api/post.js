const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug('Received POST /fragments request', { headers: req.headers });

  try {
    // Get Content-Type
    const contentType = req.get('Content-Type');

    // Reject missing or unsupported Content-Type (including application/json)
    if (
      !contentType ||
      !Fragment.isSupportedType(contentType) ||
      contentType === 'application/json'
    ) {
      logger.warn(`Unsupported or missing Content-Type: ${contentType || 'None'}`);
      return res
        .status(415)
        .json({ status: 'error', message: 'Unsupported fragment type requested by the client!' });
    }

    // Reject empty body
    if (!req.body || req.body.length === 0) {
      logger.warn('Empty request body received');
      return res
        .status(400)
        .json({ status: 'error', message: 'Bad Request: Body must not be empty' });
    }

    // Ensure body is a Buffer (No need to check for JSON parsing separately)
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body is not a Buffer');
      return res
        .status(415)
        .json({ status: 'error', message: 'Bad Request: Body must be raw binary data' });
    }

    // Use default user ID if req.user is missing (for test environment)
    const ownerId = req.user || 'test-user';

    // Create & save fragment
    const fragment = new Fragment({ ownerId, type: contentType, size: req.body.length });
    await fragment.save();
    await fragment.setData(req.body);

    logger.info(`Created new fragment: ${fragment.id}`);

    // Construct API URL
    const apiUrl = process.env.API_URL || `http://localhost:8080`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    return res
      .status(201)
      .set('Location', location)
      .json({
        status: 'ok',
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      });
  } catch (error) {
    logger.error(`Error creating fragment: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
