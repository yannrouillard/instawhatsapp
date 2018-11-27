const _ = require('lodash');

const instagramApiMock = require('instagram-private-api').V1;
const InstagramClient = require('./instagram');

// Instagram Private API mock is defined in the __mocks__ folder
// and is automatically loaded by jest
jest.mock('instagram-private-api');

test('getPosts returns all entries available', async () => {
  // Given
  const instagramClient = new InstagramClient();
  const postsCount = 10;
  instagramApiMock.configuredWith({ postsCount, chunkSize: 3 });
  // When
  const posts = await instagramClient.getPosts();
  // Then
  expect(posts.length).toEqual(postsCount);
});

test('getPosts returns no more than max entries', async () => {
  // Given
  const instagramClient = new InstagramClient();
  const max = 4;
  instagramApiMock.configuredWith({ postsCount: max + 10 });
  // When
  const posts = await instagramClient.getPosts(null, max);
  // Then
  expect(posts.length).toEqual(max);
});

test('getPosts returns only entries older than since', async () => {
  // Given
  const instagramClient = new InstagramClient();
  const postsCount = 10;
  const since = 6;
  instagramApiMock.configuredWith({ postsCount });
  // When
  const posts = await instagramClient.getPosts(since);
  // Then
  const olderThanSince = post => post.timestamp >= since;
  expect(posts.every(olderThanSince)).toBe(true);
  expect(posts.length).toEqual(postsCount - since);
});

test('getPosts converts Instagram posts to a simple structure', async () => {
  // Given
  const instagramClient = new InstagramClient();
  instagramApiMock.configuredWith({ postsCount: 1 });
  // When
  const posts = await instagramClient.getPosts();
  // Then
  expect(posts[0]).toEqual({
    location: 'location 1',
    mediaUrls: [`${instagramApiMock.FAKE_MEDIA_HOST}/post1-images1-res1`],
    timestamp: 1,
    title: 'caption 1',
  });
});

test('getPosts only keeps the first resolution of each image', async () => {
  // Given
  const instagramClient = new InstagramClient();
  instagramApiMock.configuredWith({ multiResolution: true });
  // When
  const posts = await instagramClient.getPosts();
  // Then
  const hasFirstResolution = post => post.mediaUrls.every(url => url.endsWith('-res1'));
  expect(posts.every(hasFirstResolution)).toBe(true);
});

test('getPosts properly returns media URLs for videos post', async () => {
  // Given
  const instagramClient = new InstagramClient();
  instagramApiMock.configuredWith({ postsCount: 1, type: 'videos' });
  // When
  const posts = await instagramClient.getPosts();
  // Then
  expect(posts[0].mediaUrls).toEqual([`${instagramApiMock.FAKE_MEDIA_HOST}/post1-videos1-res1`]);
});

test('getPosts correctly returns multiples media URLs for carousel post', async () => {
  // Given
  const instagramClient = new InstagramClient();
  instagramApiMock.configuredWith({ postsCount: 1, carouselCount: 3, type: 'carousel' });
  // When
  const posts = await instagramClient.getPosts();
  // Then
  expect(posts[0].mediaUrls).toEqual([
    `${instagramApiMock.FAKE_MEDIA_HOST}/post1-images1-res1`,
    `${instagramApiMock.FAKE_MEDIA_HOST}/post1-videos2-res1`,
    `${instagramApiMock.FAKE_MEDIA_HOST}/post1-images3-res1`,
  ]);
});

test('getPosts returns posts sorted by timestamp', async () => {
  // Given
  const instagramClient = new InstagramClient();
  instagramApiMock.configuredWith({ postsCount: 10 });
  // When
  const posts = await instagramClient.getPosts();
  // Then
  expect(posts).toEqual(_.sortBy(posts, 'timestamp'));
});
