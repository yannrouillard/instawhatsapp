const _ = require('lodash');

const { vol } = require('memfs');

const InstagramFeedFactoryMock = require('./infrastructure/instagram-feed-factory');
const WhatsAppFeedFactoryMock = require('./infrastructure/whatsapp-feed-factory');

const MediaFeedInfo = require('./media-feed-info');
const MediaFeedsSynchronizer = require('./media-feeds-synchronizer');
const SynchroStateDbMock = require('./infrastructure/synchronization-state-db');

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));
// WhatsAppFeedFactory and InstagramFeedFactory mock are defined
// in the __mocks__ folder and are automatically loaded by jest
jest.mock('../lib/infrastructure/whatsapp-feed-factory');
jest.mock('../lib/infrastructure/instagram-feed-factory');
jest.mock('../lib/infrastructure/synchronization-state-db');

beforeEach(() => {
  vol.reset();
  InstagramFeedFactoryMock.reset();
  WhatsAppFeedFactoryMock.reset();
});

const FAKE_INSTAGRAM_ACCOUNT = 'fakeInstagramUsername';
const FAKE_INSTAGRAM_FEED_INFO = new MediaFeedInfo({ account: FAKE_INSTAGRAM_ACCOUNT });
const FAKE_WHATSAPP_ACCOUNT = 'fakeWhatsAppAccount';
const FAKE_WHATSAPP_GROUP = 'fakeWhatsAppGroup';
const FAKE_WHATSAPP_FEED_INFO = new MediaFeedInfo({
  account: FAKE_WHATSAPP_ACCOUNT,
  group: FAKE_WHATSAPP_GROUP,
});

const FAKE_INSTAGRAM_POSTS_COUNT = 10;
const FAKE_INSTAGRAM_POSTS = _.range(1, FAKE_INSTAGRAM_POSTS_COUNT + 1).map(i => ({
  source: FAKE_INSTAGRAM_FEED_INFO,
  comment: `comment ${i}`,
  location: `location ${i}`,
  mediaUrls: 'toto',
  timestamp: i,
}));
const LAST_INSTAGRAM_POST_TIMESTAMP = FAKE_INSTAGRAM_POSTS_COUNT;

const DEFAULT_SYNCHRO_ARGS = {
  sourceFeedInfo: FAKE_INSTAGRAM_FEED_INFO,
  targetFeedInfo: FAKE_WHATSAPP_FEED_INFO,
};

const createMediaFeedsSynchronizer = () => {
  const instagramFeedFactoryMock = new InstagramFeedFactoryMock();
  const whatsAppFeedFactoryMock = new WhatsAppFeedFactoryMock();
  const synchroStateDbMock = new SynchroStateDbMock();
  return new MediaFeedsSynchronizer({
    sourceFeedFactory: instagramFeedFactoryMock,
    targetFeedFactory: whatsAppFeedFactoryMock,
    synchroStateDb: synchroStateDbMock,
  });
};

beforeEach(() => {
  InstagramFeedFactoryMock.reset();
  WhatsAppFeedFactoryMock.reset();
});

test('synchronizeMediaFeeds finds and sends all Instagram posts to Whatsapp', async () => {
  // Given
  const mediaFeedsSynchronizer = createMediaFeedsSynchronizer();
  InstagramFeedFactoryMock.configuredWith({ posts: FAKE_INSTAGRAM_POSTS });
  // When
  await mediaFeedsSynchronizer.synchronizeMediaFeeds(DEFAULT_SYNCHRO_ARGS);
  // Then
  const sentMediaPosts = WhatsAppFeedFactoryMock.getSentMediaPosts(FAKE_WHATSAPP_FEED_INFO);
  expect(sentMediaPosts).toEqual(FAKE_INSTAGRAM_POSTS);
});

test('synchronizeMediaFeeds updates the synchronisation timestamp', async () => {
  // Given
  const mediaFeedsSynchronizer = createMediaFeedsSynchronizer();
  InstagramFeedFactoryMock.configuredWith({ posts: FAKE_INSTAGRAM_POSTS });
  // When
  await mediaFeedsSynchronizer.synchronizeMediaFeeds(DEFAULT_SYNCHRO_ARGS);
  // Then
  const synchroTimestamp = await mediaFeedsSynchronizer.synchroStateDb.getSyncTimestamp(
    FAKE_INSTAGRAM_FEED_INFO,
    FAKE_WHATSAPP_FEED_INFO,
  );
  expect(synchroTimestamp).toEqual(LAST_INSTAGRAM_POST_TIMESTAMP);
});

test('synchronizeMediaFeeds starts from the last synchronisation timestamp', async () => {
  // Given
  const lastSynchroTimestamp = 6;
  const mediaFeedsSynchronizer = createMediaFeedsSynchronizer();
  InstagramFeedFactoryMock.configuredWith({ posts: FAKE_INSTAGRAM_POSTS });
  await mediaFeedsSynchronizer.synchroStateDb.saveSyncTimestamp(
    FAKE_INSTAGRAM_FEED_INFO,
    FAKE_WHATSAPP_FEED_INFO,
    lastSynchroTimestamp,
  );
  // When
  await mediaFeedsSynchronizer.synchronizeMediaFeeds(DEFAULT_SYNCHRO_ARGS);
  // Then
  const olderThanLastTimestamp = post => post.timestamp > lastSynchroTimestamp;
  const sentMediaPosts = WhatsAppFeedFactoryMock.getSentMediaPosts(FAKE_WHATSAPP_FEED_INFO);

  expect(sentMediaPosts).toSatisfyAll(olderThanLastTimestamp);
  expect(sentMediaPosts).toHaveLength(FAKE_INSTAGRAM_POSTS_COUNT - lastSynchroTimestamp);
});

test('synchronizeMediaFeeds closes the target client afterward', async () => {
  const mediaFeedsSynchronizer = createMediaFeedsSynchronizer();
  InstagramFeedFactoryMock.configuredWith({ posts: FAKE_INSTAGRAM_POSTS });
  // When
  await mediaFeedsSynchronizer.synchronizeMediaFeeds(DEFAULT_SYNCHRO_ARGS);
  // Then
  expect(WhatsAppFeedFactoryMock.isFeedClosed()).toBe(true);
});

test('synchronizeMediaFeeds do not send any message in dry run mode', async () => {
  const mediaFeedsSynchronizer = createMediaFeedsSynchronizer();
  InstagramFeedFactoryMock.configuredWith({ posts: FAKE_INSTAGRAM_POSTS });
  const specificSynchroArgs = { options: { dryRun: true } };
  // When
  const synchroArgs = { ...DEFAULT_SYNCHRO_ARGS, ...specificSynchroArgs };
  await mediaFeedsSynchronizer.synchronizeMediaFeeds(synchroArgs);
  // Then
  const sentMediaPosts = WhatsAppFeedFactoryMock.getSentMediaPosts(FAKE_WHATSAPP_FEED_INFO);
  expect(sentMediaPosts).toHaveLength(0);
});

test('synchronizeMediaFeeds do not send messages skipped', async () => {
  const skippedPosts = 4;
  const mediaFeedsSynchronizer = createMediaFeedsSynchronizer();
  InstagramFeedFactoryMock.configuredWith({ posts: FAKE_INSTAGRAM_POSTS });
  const specificSynchroArgs = { options: { skip: skippedPosts } };
  // When
  const synchroArgs = { ...DEFAULT_SYNCHRO_ARGS, ...specificSynchroArgs };
  await mediaFeedsSynchronizer.synchronizeMediaFeeds(synchroArgs);
  // Then
  const sentMediaPosts = WhatsAppFeedFactoryMock.getSentMediaPosts(FAKE_WHATSAPP_FEED_INFO);
  expect(sentMediaPosts).not.toIncludeAllMembers(FAKE_INSTAGRAM_POSTS.slice(0, skippedPosts - 1));
  expect(sentMediaPosts).toHaveLength(FAKE_INSTAGRAM_POSTS_COUNT - skippedPosts);
});
