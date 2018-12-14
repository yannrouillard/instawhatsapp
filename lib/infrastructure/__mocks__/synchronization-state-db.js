const EPOCH_TIMESTAMP = 0;

class SynchronizationStateDb {
  constructor() {
    this.timestamps = {};
  }

  async getSyncTimestamp(sourceFeedInfo, targetFeedInfo) {
    const key = SynchronizationStateDb._getKey(sourceFeedInfo, targetFeedInfo);
    return this.timestamps[key] || EPOCH_TIMESTAMP;
  }

  async saveSyncTimestamp(sourceFeedInfo, targetFeedInfo, timestamp) {
    const key = SynchronizationStateDb._getKey(sourceFeedInfo, targetFeedInfo);
    this.timestamps[key] = timestamp;
  }

  static _getKey(sourceFeedInfo, targetFeedInfo) {
    return `${sourceFeedInfo.id()}-${targetFeedInfo.id()}`;
  }
}

module.exports = SynchronizationStateDb;
