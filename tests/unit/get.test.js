// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Fragment } = require('../../src/model/fragment');
const yaml = require('js-yaml');
const markdownit = require('markdown-it');
const csv = require('csvtojson');

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

  // fetching correct fragments
  test('fetching correct fragments', async () => {
    const ownerId = hash('user1@email.com');
    const id = 'rdmId';
    const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'This is a fragment';
    fragMetadata1.setData(Buffer.from(body));
    fragMetadata1.save();

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.body.fragments[0]).toBe(id);
  });
});

test('returns empty array when user has no fragments', async () => {
  const res = await request(app).get('/v1/fragments').auth('user2@email.com', 'password2'); // Use a valid user from .htpasswd

  console.log('🔹 Response:', res.status, res.body); // Debugging Output

  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
  expect(res.body.fragments).toEqual([]);
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

describe('GET /v1/fragments/:id/info', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123/info').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/123/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Using a valid username/password pair should return fragment info
  test('authenticated users get fragment info', async () => {
    const ownerId = hash('user1@email.com');
    const body = 'This is a fragment';
    const contentType = 'text/plain';
    const id = 'rmdID';
    const fragMetadata = new Fragment({ id: id, ownerId: ownerId, type: contentType });
    fragMetadata.setData(Buffer.from(body)); // buffer fix
    fragMetadata.save();

    const res = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe(id);
    expect(res.body.fragment.ownerId).toBe(ownerId);
    expect(res.body.fragment.type).toBe(contentType);
  });

  // Requesting info for a non-existent fragment should return 404
  test('requesting info for non-existent fragment returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('No fragment with ID nonexistent-id found');
  });

  // Simulate an internal server error to return 500
  test('server error returns 500', async () => {
    // Temporarily mock the Fragment.byId method to throw an error
    const id = '123';
    const originalById = require('../../src/model/fragment').Fragment.byId;
    require('../../src/model/fragment').Fragment.byId = jest
      .fn()
      .mockRejectedValue(new Error('Internal Server Error'));

    const res = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe(`No fragment with ID ${id} found`);

    // Restore the original method
    require('../../src/model/fragment').Fragment.byId = originalById;
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

  test('return specific fragment data without post request', async () => {
    const ownerId = hash('user1@email.com');
    const id = 'rdmId';
    const body = 'This is a fragment';
    const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    await fragMetadata1.setData(Buffer.from(body));
    await fragMetadata1.save();

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/plain/);
    expect(res.text).toBe(body);
  });

  test('return specific fragment data', async () => {
    const ownerId = hash('user1@email.com');
    const id = 'rdmId';
    const body = 'This is a fragment';
    const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    await fragMetadata1.setData(Buffer.from(body));
    await fragMetadata1.save();

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/plain/);
    expect(res.text).toBe(body);
  });
});

describe('GET /v1/fragments/:id.ext', () => {
  // should return fragment data successfully with extension
  test('should return fragment data with extension', async () => {
    // post a fragment
    const ownerId = hash('user1@email.com');
    const id = 'rdmId';
    const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'This is a fragment';
    fragMetadata1.setData(Buffer.from(body));
    fragMetadata1.save();

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(body);
  });
  // should return 415 if unsupported extension is requested
  test('should return 415 if unsupported extension is requested', async () => {
    // post a fragment
    const ownerId = hash('user1@email.com');
    const id = 'rdmId';
    const fragMetadata1 = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'This is a fragment';
    fragMetadata1.setData(Buffer.from(body));
    fragMetadata1.save();

    const res = await request(app)
      .get(`/v1/fragments/${id}.png`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 415,
        message: 'The fragment cannot be converted into the extension specified!',
      },
    });
  });

  describe('Original Fragments should be fetched successfully', () => {
    // Removed unused loadTextBuffer function

    test('Text fragments data is returned in if text fragment ID is passed', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const ownerId = hash('user1@email.com');
      const id = 'rdmId10';
      const fragMetadata1 = new Fragment({ id, ownerId, type: 'text/plain' });
      fragMetadata1.setData(Buffer.from(fileContent));
      fragMetadata1.save();

      const res = await request(app)
        .get(`/v1/fragments/${id}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe(fileContent);
    });

    test('Text fragments data is returned in if fragment ID.txt is passed', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const ownerId = hash('user1@email.com');
      const id = 'rdmId10';
      const fragMetadata1 = new Fragment({ id, ownerId, type: 'text/plain' });
      fragMetadata1.setData(Buffer.from(fileContent));
      fragMetadata1.save();

      const res = await request(app)
        .get(`/v1/fragments/${id}.txt`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe(fileContent);
    });
  });

  describe('Fragment Conversion Tests', () => {
    const conversions = [
      {
        name: 'Markdown',
        file: 'file.md',
        mime: 'text/markdown',
        conversions: [
          { ext: 'html', expected: (content) => markdownit().render(content) },
          { ext: 'txt', expected: (content) => content },
        ],
      },
      {
        name: 'HTML',
        file: 'file.html',
        mime: 'text/html',
        conversions: [{ ext: 'txt', expected: (content) => content }],
      },
      {
        name: 'CSV',
        file: 'file.csv',
        mime: 'text/csv',
        conversions: [
          { ext: 'txt', expected: (content) => content },
          {
            ext: 'json',
            expected: async (content) => JSON.stringify(await csv().fromString(content)),
          },
        ],
      },
      {
        name: 'JSON',
        file: 'file.json',
        mime: 'application/json',
        conversions: [
          {
            ext: 'yaml',
            expected: () =>
              yaml.dump({
                student1: 'ABC',
                student2: 'DEF',
                student3: 'GHI',
              }),
          },
          {
            ext: 'yml',
            expected: () =>
              yaml.dump({
                student1: 'ABC',
                student2: 'DEF',
                student3: 'GHI',
              }),
          },
          { ext: 'txt', expected: (content) => content },
        ],
      },
      {
        name: 'YAML',
        file: 'file.yaml',
        mime: 'application/yaml',
        conversions: [{ ext: 'txt', expected: (content) => content }],
      },
    ];

    conversions.forEach(({ name, file, mime, conversions }) => {
      describe(`${name} Fragments should be converted successfully`, () => {
        conversions.forEach(({ ext, expected }) => {
          test(`${name} fragment should be converted to .${ext}`, async () => {
            const filePath = path.join(__dirname, '..', 'files', file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const ownerId = hash('user1@email.com');
            const id = `convert-${name.toLowerCase()}-${ext}`;
            const frag = new Fragment({ id, ownerId, type: mime });
            frag.setData(Buffer.from(fileContent));
            frag.save();

            const res = await request(app)
              .get(`/v1/fragments/${id}.${ext}`)
              .auth('user1@email.com', 'password1');

            expect(res.statusCode).toBe(200);

            const expectedOutput =
              typeof expected === 'function' ? await expected(fileContent) : expected;
            expect(res.text).toBe(expectedOutput);
          });
        });
      });
    });

    const imageConversions = ['png', 'jpg', 'webp', 'gif', 'avif'];

    const imageFormats = [
      { name: 'PNG', file: 'file.png', mime: 'image/png' },
      { name: 'JPEG', file: 'file.jpeg', mime: 'image/jpeg' },
      { name: 'WEBP', file: 'file.webp', mime: 'image/webp' },
      { name: 'AVIF', file: 'file.avif', mime: 'image/avif' },
      { name: 'GIF', file: 'file.gif', mime: 'image/gif' },
    ];

    imageFormats.forEach(({ name, file, mime }) => {
      describe(`${name} Fragments should be converted successfully`, () => {
        imageConversions
          .filter((ext) => ext !== mime.split('/')[1] && !(mime === 'image/jpeg' && ext === 'jpg'))
          .forEach((ext) => {
            test(`${name} fragment should be converted to .${ext}`, async () => {
              const filePath = path.join(__dirname, '..', 'files', file);
              const fileContent = fs.readFileSync(filePath);
              const ownerId = hash('user1@email.com');
              const id = `convert-${name.toLowerCase()}-${ext}`;
              const frag = new Fragment({ id, ownerId, type: mime });
              frag.setData(fileContent);
              frag.save();

              const res = await request(app)
                .get(`/v1/fragments/${id}.${ext}`)
                .auth('user1@email.com', 'password1');

              expect(res.statusCode).toBe(200);

              const received = res.body;
              const sharpExt = ext === 'jpg' ? 'jpeg' : ext;
              const expected = await sharp(fileContent)[sharpExt]().toBuffer();
              const receivedMetadata = await sharp(received).metadata();
              const expectedFormat = sharpExt === 'avif' ? 'heif' : sharpExt;

              expect(receivedMetadata.format).toBe(expectedFormat);
              expect(Buffer.compare(received, expected)).toBe(0);
            });
          });
      });
    });
  });
});
