// Use crypto.randomUUID() to create unique IDs
const { randomUUID } = require('crypto');
// Use content-type module to create/parse Content-Type headers
const contentType = require('content-type');
const logger = require('../logger'); // Import logger

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
    return expand ? fragments.map((f) => new Fragment(f)) : fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * **✅ Moved content conversion logic here**
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
    const fragmentData = await fragment.getData();

    // ✅ Convert content based on fragment type inside `byId()`
    fragment.content =
      fragment.type === 'application/json'
        ? JSON.parse(fragmentData.toString()) // Convert JSON to object
        : fragment.isText
          ? fragmentData.toString() // Convert text to string
          : fragmentData; // Keep binary as is (Buffer)

    return fragment;
  }

  async delete(ownerId, id) {
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

  get formats() {
    return [this.mimeType]; // For now, fragments stay in their original format
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
}

module.exports.Fragment = Fragment;
