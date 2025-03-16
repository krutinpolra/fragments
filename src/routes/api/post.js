const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  logger.debug('Received POST /fragments request', { headers: req.headers });

  try {
    // Get Content-Type
    const contentType = req.get('Content-Type');

    // Reject missing or unsupported Content-Type
    if (!contentType || !Fragment.isSupportedType(contentType)) {
      logger.warn(`Unsupported or missing Content-Type: ${contentType || 'None'}`);
      return res
        .status(415)
        .json(createErrorResponse(415, 'Unsupported fragment type requested by the client!'));
    }

    // Reject empty body directly (no need to reassign it)
    if (!req.body || req.body.length === 0) {
      logger.warn('Empty request body received');
      return res.status(400).json(createErrorResponse(400, 'Bad Request: Body must not be empty'));
    }

    // Ensure body is a Buffer (No need to check for JSON parsing separately)
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body is not a Buffer');
      return res
        .status(400)
        .json(createErrorResponse(400, 'Bad Request: Body must be raw binary data'));
    }

    if (!req.user) {
      logger.warn('Authentication failed: No user found in request');
      return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
    }

    const ownerId = req.user;

    // Create & save fragment
    const fragment = new Fragment({ ownerId, type: contentType, size: req.body.length });
    await fragment.save();
    await fragment.setData(req.body);

    logger.info(`Created new fragment: ${fragment.id}`);

    // Construct API URL
    const apiUrl = process.env.API_URL || `http://localhost:8080`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    return res.status(201).set('Location', location).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error(`Error creating fragment: ${error.message}`);
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
