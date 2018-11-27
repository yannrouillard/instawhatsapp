const instagramApi = require('instagram-private-api').V1;
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

class InstagramClient {
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.device = new instagramApi.Device(this.username);
    this.storage = new instagramApi.CookieFileStorage(`${__dirname}/cookies.json`);
  }

  async getPosts(since, max) {
    const sinceTimestamp = since || 0;

    const { device, storage, username, password } = this;
    const session = await instagramApi.Session.create(device, storage, username, password);
    const accountId = await this.storage.getAccountId();
    const imagesFeed = new instagramApi.Feed.UserMedia(session, accountId);

    let minimizedPosts = [];
    do {
      const posts = await imagesFeed.get();
      minimizedPosts = _.concat(minimizedPosts, posts.map(InstagramClient._minimizePost));
    } while (imagesFeed.isMoreAvailable() && _.last(minimizedPosts).timestamp > sinceTimestamp);

    const filteredPosts = minimizedPosts.filter(post => post.timestamp > sinceTimestamp);
    filteredPosts.reverse();
    return max ? filteredPosts.slice(0, max) : filteredPosts;
  }

  // Return a minimalist version of an Instagram post suitable for our module
  static _minimizePost(mediaPost) {
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
      location: mediaPost.location ? mediaPost.location._params.name : null,
      title: mediaPost._params.caption,
      timestamp: mediaPost._params.takenAt,
      mediaUrls: getMedia(mediaPost).map(keepOneResolution).map(media => media.url),
    };
  }
}

module.exports = InstagramClient;
