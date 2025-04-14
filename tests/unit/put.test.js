const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');
const { Fragment } = require('../../src/model/fragment');

jest.setTimeout(10000); // prevent test timeout on slower systems

describe('PUT /v1/fragments/:id', () => {
  // Should update specified fragment for given id with given new fragment
  test('Should update specified fragment for given id with given new fragment', async () => {
    const ownerId = hash('user1@email.com');
    const id = 'rdmId';
    const originalContent = 'This is a fragment';
    const updatedContent = 'This is updated fragment';

    const fragMetadata = new Fragment({ id, ownerId, type: 'text/plain' });
    await fragMetadata.setData(Buffer.from(originalContent));
    await fragMetadata.save();

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(updatedContent);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe(id);

    const updated = await Fragment.byId(ownerId, id);
    const updatedData = await updated.getData();
    expect(updatedData.toString()).toBe(updatedContent);
  });

  // Should throw if new content type is not supported
  test('Should throw if new content type is not supported', async () => {
    const ownerId = hash('user1@email.com');
    const id = 'rdmId2';
    const content = 'Invalid content type fragment';

    const fragMetadata = new Fragment({ id, ownerId, type: 'text/plain' });
    await fragMetadata.setData(Buffer.from(content));
    await fragMetadata.save();

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/abc') // unsupported type
      .send(content);

    expect(res.statusCode).toBe(415);
    expect(res.body.error.message).toBe('Unsupported fragment type requested by the client!');
  });

  // Should throw if fragment didn't exist
  test("Should throw if fragment didn't exist", async () => {
    const id = 'nonExistentId';
    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Dummy data');

    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe(`No fragment with ID ${id} found`);
  });

  // Should throw if new fragment content type is not same to prev content type
  test('Should throw if new fragment content type is not same to prev content type', async () => {
    const ownerId = hash('user1@email.com');
    const id = 'rdmIdMismatch';
    const original = 'Original content';
    const updated = 'Mismatched content';

    const fragMetadata = new Fragment({ id, ownerId, type: 'text/plain' });
    await fragMetadata.setData(Buffer.from(original));
    await fragMetadata.save();

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html') // different from 'text/plain'
      .send(updated);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Cannot change type of the fragment to text/html!');
  });
});
