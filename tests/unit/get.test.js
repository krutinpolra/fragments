// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('returns empty array when user has no fragments', async () => {
    const res = await request(app).get('/v1/fragments').auth('user2@email.com', 'password2'); // Use a valid user from .htpasswd

    console.log('🔹 Response:', res.status, res.body); // Debugging Output

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toEqual([]);
  });

  test('fetching correct fragments', async () => {
    const ownerId = hash('user1@email.com'); // Ensure consistency with the API
    const id = 'rdmId';

    // Create and store fragment
    const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'This is a fragment';

    await fragMetadata1.setData(Buffer.from(body)); // Convert string to Buffer
    await fragMetadata1.save(); // Ensure it is properly stored

    // Fetch fragments for the user
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    // Ensure fragments exist in response
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments.length).toBeGreaterThan(0);

    // Check if one of the returned fragments has the expected id
    expect(res.body.fragments.some((fragment) => fragment.id === id)).toBe(true);
  });

  describe('/v1/fragments?expand=1', () => {
    // fetching correct fragments with passed expand=1 as query parameter
    test('fetching correct fragments when passed expand=1', async () => {
      const ownerId = hash('user1@email.com');
      const id = 'rdmId';
      const type = 'text/plain';
      const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: type });
      const body = 'This is a fragment';
      fragMetadata1.setData(Buffer.from(body));
      fragMetadata1.save();

      const res = await request(app)
        .get('/v1/fragments?expand=1')
        .auth('user1@email.com', 'password1');
      expect(res.body.fragments[0].id).toBe(id);
      expect(res.body.fragments[0].ownerId).toBe(hash('user1@email.com'));
      expect(res.body.fragments[0].type).toBe(type);
    });
  });

  // Get specific fragments
  describe('GET /v1/fragments/:id', () => {
    // If the request is missing the Authorization header, it should be forbidden
    test('unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments/ecdca9b2-b841-47e5-be4d-7f880d3c8c59').expect(401));

    // If the wrong username/password pair are used (no such user), it should be forbidden
    test('incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments/ecdca9b2-b841-47e5-be4d-7f880d3c8c59')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    // throw when no fragment for given ID
    test('should return 404 If fragment not found', async () => {
      const res = await request(app).get('/v1/fragments/1234').auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(404);
    });

    // return specific fragment data without post request.
    test('return specific fragment data without post request', async () => {
      const ownerId = hash('user1@email.com');
      const id = 'rdmId';
      const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
      const body = 'This is a fragment';
      fragMetadata1.setData(Buffer.from(body));
      fragMetadata1.save();

      const res = await request(app)
        .get(`/v1/fragments/${id}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.body.content).toBe(body);
    });

    // return specific fragment data
    test('return specific fragment data', async () => {
      const ownerId = hash('user1@email.com');
      const id = 'rdmId';
      const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
      const body = 'This is a fragment';
      fragMetadata1.setData(Buffer.from(body));
      fragMetadata1.save();

      const res = await request(app)
        .get(`/v1/fragments/${id}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.body.content).toBe(body);
    });
  });
});
