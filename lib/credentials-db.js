const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILENAME = 'credentials.db';

class CredentialsDbError extends Error {}

class MissingCredentialsFileError extends CredentialsDbError {
  constructor(credentialsDb) {
    super(`Credentials password file ${credentialsDb.credentialsFilePath} is missing`);
  }
}

class InvalidFormatError extends CredentialsDbError {
  constructor(credentialsDb) {
    super(`${credentialsDb.credentialsFilePath} is not a valid JSON file`);
  }
}

class MissingPasswordError extends CredentialsDbError {
  constructor(accountName, credentialsDb) {
    super(`account ${accountName} not found in credentials file ${credentialsDb.credentialsFilePath}`);
  }
}

class CredentialsDb {
  constructor(credentialsFolder) {
    this.credentialsFilePath = path.join(credentialsFolder, CREDENTIALS_FILENAME);
  }

  getPassword(accountName) {
    try {
      const fileContent = fs.readFileSync(this.credentialsFilePath);
      const credentialsDb = JSON.parse(fileContent);
      const password = credentialsDb[accountName];

      if (password === undefined) throw new MissingPasswordError(accountName, this);
      return password;
    } catch (error) {
      const credentialsDbError = this._getCredentialsDbErrorFromRaisedError(error);
      if (credentialsDbError) throw credentialsDbError;
      throw error;
    }
  }

  _getCredentialsDbErrorFromRaisedError(error) {
    if (error.code === 'ENOENT') return new MissingCredentialsFileError(this);
    if (error.name === 'SyntaxError') return new InvalidFormatError(this);
    return null;
  }
}

module.exports = {
  CredentialsDb,
  CredentialsDbError,
  MissingCredentialsFileError,
  InvalidFormatError,
  MissingPasswordError,
};
