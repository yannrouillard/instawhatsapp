const { vol, fs } = require('memfs');
const os = require('os');
const nock = require('nock');

const downloadImage = require('./download-image');

const FAKE_IMAGE_HOST = 'http://host';
const FAKE_IMAGE_PATH = '/image.jpg';
const FAKE_IMAGE_URL = `${FAKE_IMAGE_HOST}${FAKE_IMAGE_PATH}`;
const FAKE_IMAGE_CONTENT = 'fakeContent';

beforeEach(() => {
  vol.reset();
  fs.mkdirSync(os.tmpdir(), { recursive: true });
});

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));

test('downloadImage downloads the image on the local filesystem', async () => {
  // Given
  nock(FAKE_IMAGE_HOST).get(FAKE_IMAGE_PATH).reply(200, FAKE_IMAGE_CONTENT);
  // When
  const imagePath = await downloadImage(FAKE_IMAGE_URL);
  // Then
  expect(fs.existsSync(imagePath)).toBeTruthy();
  expect(fs.readFileSync(imagePath)).toEqual(Buffer.from(FAKE_IMAGE_CONTENT));
});

test('downloadImage downloads files in the temporary directory', async () => {
  // Given
  nock(FAKE_IMAGE_HOST).get(FAKE_IMAGE_PATH).reply(200, FAKE_IMAGE_CONTENT);
  // When
  const imagePath = await downloadImage(FAKE_IMAGE_URL);
  // Then
  const pathStartingWithTmpdir = expect.stringMatching(`^${os.tmpdir()}`);
  expect(imagePath).toEqual(pathStartingWithTmpdir);
});
