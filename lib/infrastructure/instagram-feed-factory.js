const _ = require('lodash');
const { IgApiClient } = require('instagram-private-api');

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
    this.instagramApiClient = new IgApiClient();
    this.instagramApiClient.state.generateDevice(this.username);
  }

  async getMediaPosts({ skip = 0, since = 0, max } = {}) {
    const password = await this.credentialsDb.getPassword(this.username);
    const loggedInUser = await this.instagramApiClient.account.login(this.username, password);
    const imagesFeed = this.instagramApiClient.feed.user(loggedInUser.pk);

    let minimizedPosts = [];
    do {
      // eslint-disable-next-line no-await-in-loop
      const posts = await imagesFeed.items();
      minimizedPosts = _.concat(minimizedPosts, posts.map(this._minimizePost.bind(this)));
    } while (imagesFeed.isMoreAvailable() && _.last(minimizedPosts).timestamp > since);

    const filteredPosts = minimizedPosts.filter(post => post.timestamp > since);
    filteredPosts.reverse();

    const maxPosts = max || filteredPosts.length;
    return filteredPosts.slice(skip, skip + maxPosts);
  }

  // Return a minimalist version of an Instagram post suitable for our module
  _minimizePost(mediaPost) {
    // Instagram Posts contain multiple resolutions of each images but we are only interested in one
    const keepOneResolution = media => {
      return media.media_type === MEDIA_VIDEO
        ? media.video_versions[0]
        : media.image_versions2.candidates[0];
    };

    const media = mediaPost.media_type === MEDIA_CAROUSEL ? mediaPost.carousel_media : [mediaPost];
    const mediaUrls = media.map(keepOneResolution).map(m => m.url);

    return {
      source: this.instagramFeedInfo,
      location: mediaPost.location ? mediaPost.location.name : null,
      title: mediaPost.caption ? mediaPost.caption.text : '',
      timestamp: mediaPost.taken_at,
      mediaUrls,
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
