const _ = require('lodash');
const nock = require('nock');

const instagramApiMock = jest.genMockFromModule('instagram-private-api');

/* ****************************************************************************
 * Constant definitions
 *************************************************************************** */

const FAKE_MEDIA_PROTO = 'https';
const FAKE_MEDIA_HOSTNAME = 'wa';

const FAKE_MEDIA_HOST = `${FAKE_MEDIA_PROTO}://${FAKE_MEDIA_HOSTNAME}`;

const MEDIA_PATH_RE = /post\d+-(images|videos)\d+-res\d+/;

const mediaTypeIds = {
  images: 1,
  videos: 2,
  carousel: 8,
};

const mediaFieldByType = {
  images: 'image_versions2',
  videos: 'video_versions2',
};

/* ****************************************************************************
 * Private functions
 *************************************************************************** */

const alternateImageAndVideo = idx => (idx % 2 === 1 ? 'images' : 'videos');

const buildFakeImageOrVideoMedia = ({ postId, mediaType, mediaIdx = 1, resCount = 1 }) => {
  const buildUrl = resId => ({ url: `${FAKE_MEDIA_HOST}/post${postId}-${mediaType}${mediaIdx}-res${resId}` });
  return _.range(1, resCount + 1).map(buildUrl);
};

const buildFakeCarouselMedia = ({ postId, mediaIdx, resCount }) => {
  const mediaType = alternateImageAndVideo(mediaIdx);
  const media = { media_type: mediaTypeIds[mediaType] };
  media[mediaFieldByType[mediaType]] = {
    candidates: buildFakeImageOrVideoMedia({ postId, mediaType, mediaIdx, resCount }),
  };
  return media;
};

const buildFakeInstagramPost = (postId, options = {}) => {
  const type = options.type || 'images';
  const carouselCount = options.carouselCount || 5;
  const resCount = options.multiResolutions ? _.random(2, 10) : 1;

  const fakePost = {
    caption: {
      text: `caption ${postId}`,
    },
    media_type: mediaTypeIds[type],
    taken_at: postId,
    location: {
      name: `location ${postId}`,
    },
  };

  if (type === 'carousel') {
    fakePost.carousel_media = _.range(1, carouselCount + 1).map(mediaIdx =>
      buildFakeCarouselMedia({ postId, mediaIdx, resCount }),
    );
  } else {
    fakePost[mediaFieldByType[type]] = {
      candidates: buildFakeImageOrVideoMedia({ postId, mediaType: type, resCount }),
    };
  }

  return fakePost;
};

/* ****************************************************************************
 * Public functions
 *************************************************************************** */

const buildFakeInstagramPosts = (count, options) => (
  _.range(count, 0).map(postId => buildFakeInstagramPost(postId, options))
);


const configuredWith = (options) => {
  nock(FAKE_MEDIA_HOST)
    .persist()
    .get(MEDIA_PATH_RE)
    .reply(200, 'fakeContent');

  instagramApiMock.IgApiClient.mockImplementation(() => {
    const { postsCount = 10, chunkSize = 0, multiResolutions, carouselCount, type } = options;

    const posts = _.chunk(
      buildFakeInstagramPosts(postsCount, { multiResolutions, carouselCount, type }),
      chunkSize || postsCount,
    );

    return {
      state: {
        generateDevice: () => undefined,
      },
      account: {
        login: username => username,
      },
      feed: {
        user: () => {
          return {
            items: async () => posts.shift(),
            isMoreAvailable: () => posts.length !== 0,
          };
        },
      },
    };
  });
};

const reset = () => {
  instagramApiMock.IgApiClient.mockReset();
  nock.removeInterceptor({
    hostname: FAKE_MEDIA_HOSTNAME,
    proto: FAKE_MEDIA_PROTO,
    path: MEDIA_PATH_RE,
  });
};

Object.assign(instagramApiMock, {
  buildFakeInstagramPosts,
  configuredWith,
  reset,
  FAKE_MEDIA_HOST,
});

module.exports = instagramApiMock;
