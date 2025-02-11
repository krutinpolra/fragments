const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result for post request for plain text
  test('authenticated users can create a plain text fragment and location must returned in header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.headers['location']).toMatch(/\/v1\/fragments\/[a-f0-9-]+$/);
  });

  test('returns 415 for unsupported content type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/xml')
      .send('<xml>Data</xml>');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unsupported fragment type requested by the client!');
  });

  test('returns 415 if Content-Type header is missing', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1') // Valid user
      .send('This is a fragment'); // No Content-Type header

    expect(res.statusCode).toBe(415);
    expect(res.body.message).toBe('Unsupported fragment type requested by the client!');
  });

  test('returns 415 if request body contains JSON instead of raw binary data', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json') // Setting JSON content type
      .send(JSON.stringify({ text: 'This is JSON' })); // Sending JSON object

    expect(res.statusCode).toBe(415);
    expect(res.body.message).toBe('Unsupported fragment type requested by the client!');
  });

  test('returns 400 for empty body', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('')); // Empty buffer

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Bad Request: Body must not be empty');
  });

  test('returns 500 if an error occurs while creating fragment', async () => {
    jest.spyOn(Fragment.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This will fail'));

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Internal Server Error');
  });

  // response include all necessary and expected properties
  test('post return fragment with all necessary properties', async () => {
    const data = 'This is a fragment';
    const size = Buffer.byteLength(data);
    const user = 'user1@email.com';
    const type = 'text/plain';
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, 'password1')
      .set('Content-Type', type)
      .send(data);
    expect(res.statusCode).toBe(201);

    // verify all properties of the fragment object
    const fragment = res.body.fragment;
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type');
    expect(fragment).toHaveProperty('size');

    // verify return value with expected properties
    expect(fragment.type).toBe(type);
    expect(fragment.size).toBe(size);
  });

  // post fragment with unsupported type
  test('post fragment with unsupported', async () => {
    const type = 'image/abc'; // not supported type
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', type)
      .send('This is a fragment');

    expect(res.statusCode).toBe(415);
    expect(res.body.message).toBe('Unsupported fragment type requested by the client!');
  });
});
