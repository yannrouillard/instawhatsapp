const fs = require('fs');
const path = require('path');
const util = require('util');
const makeDir = require('make-dir');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const EPOCH_TIMESTAMP = 0;

class SynchronizationStateDb {
  constructor(stateFolder) {
    this.stateFolder = stateFolder;
  }

  async getSyncTimestamp(sourceFeedInfo, targetFeedInfo) {
    try {
      const stateFilePath = this._getStateFilePath(sourceFeedInfo, targetFeedInfo);
      const synchronizationInfo = JSON.parse(await readFile(stateFilePath));
      return synchronizationInfo.lastTimestamp;
    } catch (exception) {
      if (exception.code !== 'ENOENT') throw exception;
      return EPOCH_TIMESTAMP;
    }
  }

  async saveSyncTimestamp(sourceFeedInfo, targetFeedInfo, timestamp) {
    const stateFilePath = this._getStateFilePath(sourceFeedInfo, targetFeedInfo);
    await makeDir(path.dirname(stateFilePath));
    const synchronizationInfo = { lastTimestamp: timestamp };
    await writeFile(stateFilePath, JSON.stringify(synchronizationInfo));
  }

  _getStateFilePath(sourceFeedInfo, targetFeedInfo) {
    const stateFilename = `${sourceFeedInfo.id()}-${targetFeedInfo.id()}.json`;
    return path.join(this.stateFolder, stateFilename);
  }
}

module.exports = SynchronizationStateDb;
