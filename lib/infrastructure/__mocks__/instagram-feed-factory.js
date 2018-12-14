
class InstagramFeed {
  // eslint-disable-next-line class-methods-use-this
  async getMediaPosts({ since = 0, max = 0 } = {}) {
    return InstagramFeed.posts
      .filter(post => post.timestamp > since)
      .slice(0, max || InstagramFeed.posts.length + 1);
  }
}

class InstagramFeedFactory {
  // eslint-disable-next-line class-methods-use-this
  getFeed() {
    return new InstagramFeed();
  }

  static configuredWith({ posts }) {
    InstagramFeed.posts = posts;
  }

  static reset() {
    InstagramFeed.posts = [];
  }
}

InstagramFeedFactory.reset();

module.exports = InstagramFeedFactory;
