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
  videos: 'video_versions',
};

/* ****************************************************************************
 * Private functions
 *************************************************************************** */

const alternateImageAndVideo = idx => (idx % 2 === 1 ? 'images' : 'videos');

const buildFakeImageOrVideoMedia = ({ postId, mediaType, mediaIdx = 1, resCount = 1 }) => {
  const buildUrl = resId => ({
    url: `${FAKE_MEDIA_HOST}/post${postId}-${mediaType}${mediaIdx}-res${resId}`,
  });
  const medias = _.range(1, resCount + 1).map(buildUrl);
  return mediaType === 'images' ? { candidates: medias } : medias;
};

const buildFakeCarouselMedia = ({ postId, mediaIdx, resCount }) => {
  const mediaType = alternateImageAndVideo(mediaIdx);
  const media = { media_type: mediaTypeIds[mediaType] };
  media[mediaFieldByType[mediaType]] = buildFakeImageOrVideoMedia({
    postId,
    mediaType,
    mediaIdx,
    resCount,
  });
  return media;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const buildFakeInstagramPost = (postId, options = {}) => {
  const type = options.type || 'images';
  const carouselCount = options.carouselCount || 5;
  const resCount = options.multiResolutions ? _.random(2, 10) : 1;
  const caption = !options.noTitle ? { text: `caption ${postId}` } : null;

  const fakePost = {
    caption,
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
    fakePost[mediaFieldByType[type]] = buildFakeImageOrVideoMedia({
      postId,
      mediaType: type,
      resCount,
    });
  }

  return fakePost;
};

/* ****************************************************************************
 * Public functions
 *************************************************************************** */

const buildFakeInstagramPosts = (count, options) =>
  _.range(count, 0).map(postId => buildFakeInstagramPost(postId, options));

const configuredWith = options => {
  nock(FAKE_MEDIA_HOST)
    .persist()
    .get(MEDIA_PATH_RE)
    .reply(200, 'fakeContent');

  instagramApiMock.IgApiClient.mockImplementation(() => {
    const {
      postsCount = 10,
      chunkSize = 0,
      multiResolutions,
      carouselCount,
      type,
      noTitle,
    } = options;

    const posts = _.chunk(
      buildFakeInstagramPosts(postsCount, { multiResolutions, carouselCount, type, noTitle }),
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
