const EventEmitter = require('events');

const asyncSequentialMap = require('./helpers/async-sequential-map');

class MediaFeedsSynchronizer extends EventEmitter {
  constructor({ sourceFeedFactory, targetFeedFactory, synchroStateDb }) {
    super();
    this.sourceFeedFactory = sourceFeedFactory;
    this.targetFeedFactory = targetFeedFactory;
    this.synchroStateDb = synchroStateDb;
  }

  async synchronizeMediaFeeds({ sourceFeedInfo, targetFeedInfo, options = {} }) {
    const lastTimestamp = await this.synchroStateDb.getSyncTimestamp(
      sourceFeedInfo,
      targetFeedInfo,
    );
    const { dryRun, max, since = lastTimestamp } = options;

    const posts = await this.getMediaPostsFromSource(sourceFeedInfo, { since, max });
    await this.sendMediaPostsToTarget(posts, targetFeedInfo, { dryRun });
  }

  async getMediaPostsFromSource(sourceFeedInfo, options) {
    const sourceFeed = this.sourceFeedFactory.getFeed(sourceFeedInfo);
    const posts = await sourceFeed.getMediaPosts(options);
    this.emit('mediaPostsFound', posts);
    return posts;
  }

  async sendMediaPostsToTarget(posts, targetFeedInfo, options) {
    const targetFeed = this.targetFeedFactory.getFeed(targetFeedInfo);

    const sendOnePost = async (post) => {
      this.emit('sendingMediaPost', post);
      if (options.dryRun) return;
      await targetFeed.sendMediaPost(post);
      await this.synchroStateDb.saveSyncTimestamp(post.source, targetFeedInfo, post.timestamp);
    };

    try {
      await asyncSequentialMap(posts, sendOnePost);
    } finally {
      await targetFeed.close();
    }
  }
}

module.exports = MediaFeedsSynchronizer;
