const request = require('supertest');
const express = require('express');
const router = require('../../src/routes');
const { Fragment } = require('../../src/model/fragment');

// Create an Express app to test
const app = express();

// Middleware to handle raw binary data
app.use(express.raw({ type: '*/*', limit: '5mb' }));

// Mock authentication middleware
app.use(
  '/',
  (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    req.user = 'test-user'; // Simulated authenticated user
    next();
  },
  router
);

describe('POST /fragments', () => {
  test('should create a new fragment with valid content type', async () => {
    const fragmentData = Buffer.from('Hello, this is a test fragment');

    const res = await request(app)
      .post('/fragments')
      .auth('user1@email.com', 'password1') // Simulated authentication
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    console.log(res.body); // Debugging

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment).toHaveProperty('ownerId');
    expect(res.body.fragment).toHaveProperty('created');
    expect(res.body.fragment).toHaveProperty('updated');
    expect(res.body.fragment).toHaveProperty('type', 'text/plain');
    expect(res.body.fragment).toHaveProperty('size', fragmentData.length);

    const expectedBaseUrl = process.env.API_URL || 'http://localhost:8080';
    expect(res.headers.location).toBe(`${expectedBaseUrl}/v1/fragments/${res.body.fragment.id}`);
  });

  test('should return 415 for unsupported content type', async () => {
    const res = await request(app)
      .post('/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/msword')
      .send('Unsupported data');

    expect(res.status).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unsupported Media Type');
  });

  test('should return 415 if no content type is provided', async () => {
    const res = await request(app)
      .post('/fragments')
      .auth('user1@email.com', 'password1')
      .send('No Content-Type header');

    expect(res.status).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unsupported Media Type');
  });

  test('should return 400 for invalid (non-buffer) body', async () => {
    const res = await request(app)
      .post('/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('{"message": "Invalid JSON instead of raw data"}')); // Send JSON-like string

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Bad Request: Body must be raw binary data');
  });

  test('should return 400 if body is empty', async () => {
    const res = await request(app)
      .post('/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('')); // Send an empty buffer

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Bad Request: Body must be raw binary data');
  });

  test('should return 500 if an error occurs while creating fragment', async () => {
    jest.spyOn(Fragment.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .post('/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This will fail'));

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Internal Server Error');
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app)
      .post('/fragments')
      .set('Content-Type', 'text/plain')
      .send('Unauthorized request');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });
});
