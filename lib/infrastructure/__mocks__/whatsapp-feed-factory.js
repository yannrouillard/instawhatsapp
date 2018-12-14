
class WhatsAppFeed {
  constructor(whatsAppFeedInfo) {
    this.whatsAppFeedInfo = whatsAppFeedInfo;
  }

  async sendMediaPost(post) {
    if (!WhatsAppFeed.mediaPostsSent[this.whatsAppFeedInfo.id()]) {
      WhatsAppFeed.mediaPostsSent[this.whatsAppFeedInfo.id()] = [];
    }
    WhatsAppFeed.mediaPostsSent[this.whatsAppFeedInfo.id()].push(post);
  }

  // eslint-disable-next-line class-methods-use-this
  async close() {
    WhatsAppFeed.closed = true;
  }
}

class WhatsAppFeedFactory {
  // eslint-disable-next-line class-methods-use-this
  getFeed(whatsAppFeedInfo) {
    return new WhatsAppFeed(whatsAppFeedInfo);
  }

  // eslint-disable-next-line class-methods-use-this
  static getSentMediaPosts(whatsAppFeedInfo) {
    return WhatsAppFeed.mediaPostsSent[whatsAppFeedInfo.id()] || [];
  }

  static reset() {
    WhatsAppFeed.closed = true;
    WhatsAppFeed.mediaPostsSent = {};
  }

  static isFeedClosed() {
    return WhatsAppFeed.closed;
  }
}

WhatsAppFeedFactory.reset();

module.exports = WhatsAppFeedFactory;
