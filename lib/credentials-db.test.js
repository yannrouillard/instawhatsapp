const { vol } = require('memfs');

const { CredentialsDb, MissingPasswordError, MissingCredentialsFileError, InvalidFormatError } = require('./credentials-db');

const CREDENTIALS_FOLDER = '/credentials';
const CREDENTIALS_FILE = './credentials.db';

const FAKE_ACCOUNT_NAME = 'fakeAccount';

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));

beforeEach(() => vol.reset());

const credentialsDbContentSetTo = (credentialsDbContent) => {
  vol.fromJSON({ [CREDENTIALS_FILE]: credentialsDbContent }, CREDENTIALS_FOLDER);
};

test('findPassword return the password if present in database', async () => {
  // Given
  const password = 'fakePassword';
  credentialsDbContentSetTo(JSON.stringify({ [FAKE_ACCOUNT_NAME]: password }));
  // When
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  const foundPassword = credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
  // Then
  expect(foundPassword).toEqual(password);
});

test('findPassword raise an exception if file is not found', async () => {
  // Given
  // No credentialsDB initialization
  // When
  try {
    const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
    credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
  // Then
    expect(error).toBeInstanceOf(MissingCredentialsFileError);
  }
});

test('findPassword raise an exception if invalid format', async () => {
  // Given
  credentialsDbContentSetTo('invalid format:');
  // When
  try {
    const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
    credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
  // Then
    expect(error).toBeInstanceOf(InvalidFormatError);
  }
});

test('findPassword raise an exception if account is not found', async () => {
  // Given
  credentialsDbContentSetTo('{}');
  // When
  try {
    const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
    credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
  // Then
    expect(error).toBeInstanceOf(MissingPasswordError);
  }
});
