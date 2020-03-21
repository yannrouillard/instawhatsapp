const { vol } = require('memfs');

const { CredentialsDb, MissingPasswordError, InvalidFormatError } = require('./credentials-db');

const CREDENTIALS_FOLDER = '/credentials';
const CREDENTIALS_FILE = './credentials.db';

const FAKE_ACCOUNT_NAME = 'fakeAccount';
const FAKE_PASSWORD = 'fakePassword';

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));

beforeEach(() => vol.reset());

const credentialsDbContentSetTo = credentialsDbContent => {
  vol.fromJSON({ [CREDENTIALS_FILE]: credentialsDbContent }, CREDENTIALS_FOLDER);
};

test('getPassword return the password if present in database', async () => {
  // Given
  credentialsDbContentSetTo(JSON.stringify({ [FAKE_ACCOUNT_NAME]: FAKE_PASSWORD }));
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  // When
  const foundPassword = await credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
  // Then
  expect(foundPassword).toEqual(FAKE_PASSWORD);
});

test('getPassword raise an exception if file is not found', async () => {
  // Given
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  // When
  try {
    await credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
    // Then
    expect(error).toBeInstanceOf(MissingPasswordError);
  }
});

test('getPassword raise an exception if invalid format', async () => {
  // Given
  credentialsDbContentSetTo('invalid format:');
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  // When
  try {
    await credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
    // Then
    expect(error).toBeInstanceOf(InvalidFormatError);
  }
});

test('getPassword raise an exception if account is not found', async () => {
  // Given
  credentialsDbContentSetTo('{}');
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  // When
  try {
    await credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
    // Then
    expect(error).toBeInstanceOf(MissingPasswordError);
  }
});

test('password set by setEphemeralPassword is returned by getPassword ', async () => {
  // Given
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  // When
  credentialsDb.setEphemeralPassword(FAKE_ACCOUNT_NAME, FAKE_PASSWORD);
  const password = await credentialsDb.getPassword(FAKE_ACCOUNT_NAME);
  // Then
  expect(password).toEqual(FAKE_PASSWORD);
});
