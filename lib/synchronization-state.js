const fs = require('fs');
const path = require('path');
const util = require('util');
const makeDir = require('make-dir');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

class SynchronizationState {
  constructor(instagramUsername, whatsAppGroup, stateFolder) {
    this.whatsAppGroup = whatsAppGroup;
    this.instagramUsername = instagramUsername;
    this.stateFile = path.join(stateFolder, `${this.instagramUsername}-${this.whatsAppGroup}.json`);
    this.lastTimestamp = 0;
  }

  update(post) {
    this.lastTimestamp = post.timestamp;
    return this;
  }

  async loadFromDisk() {
    try {
      const synchronisationStateString = await readFile(this.stateFile);
      const newState = JSON.parse(synchronisationStateString);
      Object.assign(this, newState);
    } catch (exception) {
      if (exception.code !== 'ENOENT') {
        throw (exception);
      }
    }
    return this;
  }

  async saveToDisk() {
    const state = {
      lastTimestamp: this.lastTimestamp,
      instagramUsername: this.instagramUsername,
      whatsAppGroup: this.whatsAppGroup,
    };
    await makeDir(path.dirname(this.stateFile));
    await writeFile(this.stateFile, JSON.stringify(state));
  }

  withSaveState(postFunction) {
    return async (post) => {
      await postFunction(post);
      await this.update(post).saveToDisk();
    };
  }
}

module.exports = SynchronizationState;
