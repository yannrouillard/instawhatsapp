const { vol } = require('memfs');

const CredentialsDb = require('./credentials-db');

const CREDENTIALS_FOLDER = '/credentials';

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));

beforeEach(() => vol.reset());

test('findPassword return the password if present in database', async () => {
  // Given
  const accountName = 'fakeAccount';
  const password = 'fakePassword';
  const credentialsDbContent = JSON.stringify({ fakeAccount: password });
  vol.fromJSON({ './credentials.db': credentialsDbContent }, CREDENTIALS_FOLDER);
  // When
  const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
  const foundPassword = credentialsDb.getPassword(accountName);
  // Then
  expect(foundPassword).toEqual(password);
});

test('findPassword raise an exception if file is not found', async () => {
  // Given
  const accountName = 'fakeAccount';
  // When
  try {
    const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
    credentialsDb.getPassword(accountName);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
  // Then
    expect(error.name).toBe('CredentialsDbError');
    expect(error.code).toBe('MISSING_CREDENTIALS_FILE');
  }
});

test('findPassword raise an exception if invalid format', async () => {
  // Given
  const accountName = 'fakeAccount';
  vol.fromJSON({ './credentials.db': 'invalid format:' }, CREDENTIALS_FOLDER);
  // When
  try {
    const credentialsDb = new CredentialsDb(CREDENTIALS_FOLDER);
    credentialsDb.getPassword(accountName);
    // We shouldn't reach here
    expect(false).toBeTruthy();
  } catch (error) {
  // Then
    expect(error.name).toBe('CredentialsDbError');
    expect(error.code).toBe('INVALID_FORMAT');
  }
});
