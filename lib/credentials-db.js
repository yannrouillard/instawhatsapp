const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILENAME = 'credentials.db';

const buildError = (code, message) => {
  const credentialsDbError = new Error(message);
  credentialsDbError.name = 'CredentialsDbError';
  credentialsDbError.code = code;
  return credentialsDbError;
};

class CredentialsDb {
  constructor(credentialsFolder) {
    this.credentialsFilePath = path.join(credentialsFolder, CREDENTIALS_FILENAME);
  }

  getPassword(accountName) {
    try {
      const fileContent = fs.readFileSync(this.credentialsFilePath);
      const credentialsDb = JSON.parse(fileContent);
      const password = credentialsDb[accountName];

      if (password === undefined) {
        throw buildError('MISSING_ACCOUNT', `account ${accountName} not found in credentials file ${this.credentialsFilePath}`);
      }

      return password;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw buildError('MISSING_CREDENTIALS_FILE', `Credentials password file ${this.credentialsFilePath} is missing`);
      }
      if (error.name === 'SyntaxError') {
        throw buildError('INVALID_FORMAT', `${this.credentialsFilePath} is not a valid JSON file`);
      }
      throw error;
    }
  }
}

module.exports = CredentialsDb;
