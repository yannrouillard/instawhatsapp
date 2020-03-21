const _ = require('lodash');

const instagramApiMock = require('instagram-private-api');

const { CredentialsDb } = require('./credentials-db');
const InstagramFeedFactory = require('./instagram-feed-factory');

const FAKE_INSTAGRAM_ACCOUNT = 'fakeAccount';
const FAKE_INSTAGRAM_PASSWORD = 'fakePassword';
const FAKE_CREDENTIALS_DB_FOLDER = '/tmp/credentials.db.json';
const FAKE_INSTAGRAM_FEED_INFO = { account: FAKE_INSTAGRAM_ACCOUNT };

// Instagram Private API mock is defined in the __mocks__ folder
// and is automatically loaded by jest
jest.mock('instagram-private-api');

const createInstagramFeed = () => {
  const credentialsDb = new CredentialsDb(FAKE_CREDENTIALS_DB_FOLDER);
  credentialsDb.setEphemeralPassword(FAKE_INSTAGRAM_ACCOUNT, FAKE_INSTAGRAM_PASSWORD);
  const instagramFeedFactory = new InstagramFeedFactory(credentialsDb);
  return instagramFeedFactory.getFeed(FAKE_INSTAGRAM_FEED_INFO);
};

test('getMediaPosts returns all entries available', async () => {
  // Given
  const postsCount = 10;
  instagramApiMock.configuredWith({ postsCount, chunkSize: 3 });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  expect(posts).toHaveLength(postsCount);
});

test('getMediaPosts returns no more than max entries', async () => {
  // Given
  const max = 4;
  instagramApiMock.configuredWith({ postsCount: max + 10 });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts({ max });
  // Then
  expect(posts).toHaveLength(max);
});

test('getMediaPosts returns only entries older than since', async () => {
  // Given
  const postsCount = 10;
  const since = 6;
  instagramApiMock.configuredWith({ postsCount });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts({ since });
  // Then
  const olderThanSince = post => post.timestamp >= since;
  expect(posts).toSatisfyAll(olderThanSince);
  expect(posts).toHaveLength(postsCount - since);
});

test('getMediaPosts converts Instagram posts to a simple structure', async () => {
  // Given
  instagramApiMock.configuredWith({ postsCount: 1 });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  expect(posts[0]).toEqual({
    source: FAKE_INSTAGRAM_FEED_INFO,
    location: 'location 1',
    mediaUrls: [`${instagramApiMock.FAKE_MEDIA_HOST}/post1-images1-res1`],
    timestamp: 1,
    title: 'caption 1',
  });
});

test('getMediaPosts only keeps the first resolution of each image', async () => {
  // Given
  instagramApiMock.configuredWith({ multiResolution: true });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  const hasFirstResolution = post => post.mediaUrls.every(url => url.endsWith('-res1'));
  expect(posts.every(hasFirstResolution)).toBe(true);
});

test('getMediaPosts properly returns media URLs for videos post', async () => {
  // Given
  instagramApiMock.configuredWith({ postsCount: 1, type: 'videos' });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  expect(posts[0].mediaUrls).toEqual([`${instagramApiMock.FAKE_MEDIA_HOST}/post1-videos1-res1`]);
});

test('getMediaPosts correctly returns multiples media URLs for carousel post', async () => {
  // Given
  instagramApiMock.configuredWith({ postsCount: 1, carouselCount: 3, type: 'carousel' });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  expect(posts[0].mediaUrls).toEqual([
    `${instagramApiMock.FAKE_MEDIA_HOST}/post1-images1-res1`,
    `${instagramApiMock.FAKE_MEDIA_HOST}/post1-videos2-res1`,
    `${instagramApiMock.FAKE_MEDIA_HOST}/post1-images3-res1`,
  ]);
});

test('getMediaPosts returns posts sorted by timestamp', async () => {
  // Given
  instagramApiMock.configuredWith({ postsCount: 10 });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  expect(posts).toEqual(_.sortBy(posts, 'timestamp'));
});

test('getMediaPosts skips posts if skip option is set', async () => {
  // Given
  const postsCount = 10;
  const skipPosts = 4;
  instagramApiMock.configuredWith({ postsCount });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts({ skip: skipPosts });
  // Then
  expect(posts).toHaveLength(postsCount - skipPosts);
  expect(posts[0]).toEqual({
    source: FAKE_INSTAGRAM_FEED_INFO,
    location: 'location 5',
    mediaUrls: [`${instagramApiMock.FAKE_MEDIA_HOST}/post5-images1-res1`],
    timestamp: 5,
    title: 'caption 5',
  });
});

test('getMediaPosts properly handle post with no title', async () => {
  // Given
  instagramApiMock.configuredWith({ postsCount: 1, noTitle: true });
  const instagramFeed = createInstagramFeed();
  // When
  const posts = await instagramFeed.getMediaPosts();
  // Then
  expect(posts[0].title).toEqual('');
});
