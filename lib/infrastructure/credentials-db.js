const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const CREDENTIALS_FILENAME = 'credentials.db';

class CredentialsDbError extends Error {}

class InvalidFormatError extends CredentialsDbError {
  constructor(credentialsDb) {
    super(`${credentialsDb.credentialsFilePath} is not a valid JSON file`);
  }
}

class MissingPasswordError extends CredentialsDbError {
  constructor(accountName, credentialsDb) {
    super(
      `account ${accountName} not found in credentials file ${credentialsDb.credentialsFilePath}`,
    );
  }
}

class CredentialsDb {
  constructor(credentialsFolder) {
    this.credentialsFilePath = path.join(credentialsFolder, CREDENTIALS_FILENAME);
    this.ephemeralPasswords = {};
  }

  async getPassword(accountName) {
    const credentialsDb = await this._loadCredentialsDb();
    const password = credentialsDb[accountName];
    if (password === undefined) throw new MissingPasswordError(accountName, this);
    return password;
  }

  setEphemeralPassword(accountName, password) {
    this.ephemeralPasswords[accountName] = password;
  }

  async _loadCredentialsDb() {
    const credentialsDb = await this._loadCredentialsDbFromDisk();
    return Object.assign(credentialsDb, this.ephemeralPasswords);
  }

  async _loadCredentialsDbFromDisk() {
    try {
      const fileContent = await readFile(this.credentialsFilePath);
      return JSON.parse(fileContent);
    } catch (error) {
      if (error.name === 'SyntaxError') throw new InvalidFormatError(this);
      if (error.code === 'ENOENT') return {};
      throw error;
    }
  }
}

module.exports = {
  CredentialsDb,
  CredentialsDbError,
  InvalidFormatError,
  MissingPasswordError,
};
