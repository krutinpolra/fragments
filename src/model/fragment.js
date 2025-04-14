// Use crypto.randomUUID() to create unique IDs
const { randomUUID } = require('crypto');
// Use content-type module to create/parse Content-Type headers
const contentType = require('content-type');
const logger = require('../logger'); // Import logger
const markdownit = require('markdown-it');
const csv = require('csvtojson'); // Import csvtojson module
const yaml = require('js-yaml'); // Import js-yaml module
const sharp = require('sharp'); // Import sharp module

const md = markdownit();

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  // Define valid types
  static validTypes = [
    `text/plain`,
    `text/markdown`,
    `text/html`,
    `text/csv`,
    `application/json`,
    `application/yaml`,
    `image/png`,
    `image/jpeg`,
    `image/webp`,
    `image/gif`,
    `image/avif`,
  ];

  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error('ownerId and type are required');
    }

    if (!Fragment.isSupportedType(type)) {
      throw new Error(`Unsupported content type: ${type}`);
    }

    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a non-negative number');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created ? new Date(created).toISOString() : new Date().toISOString();
    this.updated = updated ? new Date(updated).toISOString() : this.created;
  }

  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);
    return fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * ** Moved content conversion logic here**
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragmentMetadata = await readFragment(ownerId, id);
    if (!fragmentMetadata) {
      throw new Error(`Fragment with id ${id} not found`);
    }

    const fragment = new Fragment(fragmentMetadata);
    return fragment;
  }

  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
    logger.info(`Deleted fragment with id ${id} for user ${ownerId}`);
  }

  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
    logger.info(`Fragment ${this.id} saved for user ${this.ownerId}`);
  }

  async getData() {
    return await readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save(); // Update metadata after setting data
  }

  get mimeType() {
    return contentType.parse(this.type).type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    const validConversions = {
      'text/plain': ['text/plain'],
      'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
      'text/html': ['text/html', 'text/plain'],
      'text/csv': ['text/csv', 'text/plain', 'application/json'],
      'application/json': ['application/json', 'application/yaml', 'text/plain'],
      'application/yaml': ['application/yaml', 'text/plain'],
      'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    };
    return validConversions[this.mimeType] || false;
  }

  static isSupportedType(value) {
    if (!value) return false;
    try {
      const { type } = contentType.parse(value);
      return Fragment.validTypes.includes(type);
    } catch (error) {
      throw new error(`Invalid Content-Type: ${value}`);
    }
  }

  async getConvertedInto(type) {
    const fragmentData = await this.getData();
    const fragmentType = this.type;

    const conversions = {
      'text/plain': {
        '.txt': () => fragmentData,
      },
      'text/markdown': {
        '.md': () => fragmentData,
        '.html': () => md.render(fragmentData.toString('utf8')),
        '.txt': () => fragmentData.toString('utf8'),
      },
      'text/html': {
        '.html': () => fragmentData,
        '.txt': () => fragmentData.toString('utf8'),
      },
      'text/csv': {
        '.csv': () => fragmentData,
        '.txt': () => fragmentData.toString('utf8'),
        '.json': () =>
          csv()
            .fromString(fragmentData.toString('utf8'))
            .then((jsonObj) => {
              return jsonObj;
            }),
      },
      'application/json': {
        '.json': () => fragmentData,
        '.yaml': () => yaml.dump(JSON.parse(fragmentData.toString('utf8'))),
        '.yml': () => yaml.dump(JSON.parse(fragmentData.toString('utf8'))),
        '.txt': () => fragmentData.toString('utf8'),
      },
      'application/yaml': {
        '.yaml': () => fragmentData,
        '.txt': () => fragmentData.toString('utf8'),
      },
      'image/png': {
        '.png': () => fragmentData,
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.jpeg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
      'image/jpeg': {
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': () => fragmentData,
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
      'image/webp': {
        '.webp': () => fragmentData,
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
      'image/avif': {
        '.avif': () => fragmentData,
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
      },
      'image/gif': {
        '.gif': () => fragmentData,
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
    };

    if (conversions[fragmentType] && conversions[fragmentType][type]) {
      return await conversions[fragmentType][type]();
      // return await sharp(fragmentData).jpeg().toBuffer();
    }

    throw new Error(`Unsupported conversion from ${fragmentType} to ${type}`);
  }
}

module.exports.Fragment = Fragment;
