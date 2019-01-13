const instagramPrivateApi = require('instagram-private-api').V1;
const _ = require('lodash');

/* ****************************************************************************
 * Constant definitions
 *************************************************************************** */

// const MEDIA_PHOTO = 1;
const MEDIA_VIDEO = 2;
const MEDIA_CAROUSEL = 8;


/* ****************************************************************************
 * Public functions
 *************************************************************************** */

class InstagramFeed {
  constructor(instagramFeedInfo, configuration) {
    this.instagramFeedInfo = instagramFeedInfo;
    this.username = instagramFeedInfo.account;
    this.credentialsDb = configuration.credentialsDb;
    this.device = new instagramPrivateApi.Device(this.username);
    this.storage = new instagramPrivateApi.CookieMemoryStorage();
  }

  async getMediaPosts({ skip = 0, since = 0, max } = {}) {
    const { device, storage, username } = this;
    const password = await this.credentialsDb.getPassword(username);
    const session = await instagramPrivateApi.Session.create(device, storage, username, password);
    const accountId = await this.storage.getAccountId();
    const imagesFeed = new instagramPrivateApi.Feed.UserMedia(session, accountId);

    const minimizePost = this._minimizePost.bind(this);

    let minimizedPosts = [];
    do {
      const posts = await imagesFeed.get();
      minimizedPosts = _.concat(minimizedPosts, posts.map(minimizePost));
    } while (imagesFeed.isMoreAvailable() && _.last(minimizedPosts).timestamp > since);

    const filteredPosts = minimizedPosts.filter(post => post.timestamp > since);
    filteredPosts.reverse();

    const maxPosts = max || filteredPosts.length;
    return filteredPosts.slice(skip, skip + maxPosts);
  }

  // Return a minimalist version of an Instagram post suitable for our module
  _minimizePost(mediaPost) {
    // Due to bug https://github.com/huttarichard/instagram-private-api/issues/529
    // we must use post._params instead of post.params for all params access

    const getMedia = post => (
      post._params.mediaType === MEDIA_CAROUSEL ? post._params.carouselMedia : [post]
    );

    // Instagram Posts contain multiple resolutions of each images but we are only interested in one
    const keepOneResolution = media => (
      media._params.mediaType === MEDIA_VIDEO ? media._params.videos[0] : media._params.images[0]
    );

    return {
      source: this.instagramFeedInfo,
      location: mediaPost.location ? mediaPost.location._params.name : null,
      title: mediaPost._params.caption,
      timestamp: mediaPost._params.takenAt,
      mediaUrls: getMedia(mediaPost).map(keepOneResolution).map(media => media.url),
    };
  }
}

class InstagramFeeds {
  constructor(credentialsDb) {
    this.configuration = { credentialsDb };
  }

  getFeed(instagramFeedInfo) {
    return new InstagramFeed(instagramFeedInfo, this.configuration);
  }
}


module.exports = InstagramFeeds;
