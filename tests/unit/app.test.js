const request = require('supertest');
const app = require('../../src/app'); // Import the Express app

describe('404 Handler', () => {
  test('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'not found',
        code: 404,
      },
    });
  });
});
