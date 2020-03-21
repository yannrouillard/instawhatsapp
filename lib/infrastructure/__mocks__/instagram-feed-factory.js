class InstagramFeed {
  // eslint-disable-next-line class-methods-use-this
  async getMediaPosts({ skip = 0, since = 0, max = 0 } = {}) {
    return InstagramFeed.posts
      .filter(post => post.timestamp > since)
      .slice(skip, skip + (max || InstagramFeed.posts.length));
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
