const { vol, fs } = require('memfs');
const os = require('os');
const path = require('path');

const findGoogleChrome = require('./google-chrome-finder');

const makedir = filePath => fs.mkdirSync(filePath, { recursive: true });
const touchFile = filePath => fs.closeSync(fs.openSync(filePath, 'w'));

const GOOGLE_CHROME_PATH_MAC_OS_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

beforeEach(() => vol.reset());

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));
jest.mock('os');

test('findGoogleChrome raises an exception if OS is unknown', () => {
  // Given
  os.platform.mockReturnValue('UnknownOS');
  // When and then
  expect(() => findGoogleChrome()).toThrow("Couldn't find Google Chrome Path");
});

test('findGoogleChrome raises an exception if Google Chrome is not found', () => {
  // Given
  os.platform.mockReturnValue('darwin');
  // When and then
  expect(() => findGoogleChrome()).toThrow("Couldn't find Google Chrome Path");
});

test('findGoogleChrome returns the Google Chrome binary path if present', () => {
  // Given
  os.platform.mockReturnValue('darwin');
  makedir(path.dirname(GOOGLE_CHROME_PATH_MAC_OS_PATH));
  touchFile(GOOGLE_CHROME_PATH_MAC_OS_PATH);
  // When
  const googleChromePath = findGoogleChrome();
  // When and then
  expect(googleChromePath).toEqual(GOOGLE_CHROME_PATH_MAC_OS_PATH);
});
