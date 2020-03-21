const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { vol } = require('memfs');

const instagramPrivateApiMock = require('instagram-private-api');
const WhatsAppFeedFactory = require('../lib/infrastructure/whatsapp-feed-factory');
const MediaFeedInfo = require('../lib/media-feed-info');

const synchronizeFromFile = require('./synchronize-from-file');

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));
// Instagram Private API and WhatsAppClient mock are defined
// in the __mocks__ folder and are automatically loaded by jest
jest.mock('../lib/infrastructure/whatsapp-feed-factory');
jest.mock('instagram-private-api');

const DEFAULT_SYNC_COUNT = 3;
const DEFAULT_SYNC_LIST = _.range(1, DEFAULT_SYNC_COUNT + 1).map(i => ({
  instagramAccount: `fakeInstagramAccount${i}`,
  whatsAppAccount: `fakeWhatsAppAccount${i}`,
  whatsAppGroup: `fakeWhatsAppGroup${i}`,
}));
const DEFAULT_TARGET_FEEDS = DEFAULT_SYNC_LIST.map(
  sync =>
    new MediaFeedInfo({
      account: sync.whatsAppAccount,
      name: sync.whatsAppGroup,
    }),
);

const DEFAULT_COMMAND_ARGS = {
  googleChromePath: '/path/to/Google/Chrome',
  whatsAppDataFolder: '/path/to/whatsapp/data/folder',
  syncStateFolder: '/path/to/sync/state/folder',
  syncListFile: '/path/to/sync/file',
  quiet: true,
};

beforeEach(() => {
  vol.reset();
  instagramPrivateApiMock.reset();
  WhatsAppFeedFactory.reset();
});

const credentialsDbInitializedFrom = (commandArgs, syncList) => {
  const credentialsDbFile = path.join(commandArgs.whatsAppDataFolder, 'credentials.db');

  const generatefakeAccountPasswordPair = sync => [sync.instagramAccount, 'fakePassword'];
  const isValidEntry = sync => sync.instagramAccount && sync.whatsAppAccount && sync.whatsAppGroup;
  const credentialsDbContent = _.fromPairs(
    syncList.filter(isValidEntry).map(generatefakeAccountPasswordPair),
  );

  fs.mkdirSync(path.dirname(credentialsDbFile), { recursive: true });
  fs.writeFileSync(credentialsDbFile, JSON.stringify(credentialsDbContent));
};

const syncListFileInitializedFrom = (commandArgs, syncList) => {
  const toSyncListLine = sync =>
    `${sync.instagramAccount} ${sync.whatsAppAccount} ${sync.whatsAppGroup}`;
  const fileContent = syncList.map(toSyncListLine).join('\n');

  fs.mkdirSync(path.dirname(commandArgs.syncListFile), { recursive: true });
  fs.writeFileSync(commandArgs.syncListFile, fileContent);
};

test('synchronize send posts for all instagram-whatsapp synchro configured in sync list file', async () => {
  // Given
  const postsCount = 2;

  instagramPrivateApiMock.configuredWith({ postsCount });
  syncListFileInitializedFrom(DEFAULT_COMMAND_ARGS, DEFAULT_SYNC_LIST);
  credentialsDbInitializedFrom(DEFAULT_COMMAND_ARGS, DEFAULT_SYNC_LIST);

  // When
  await synchronizeFromFile.handler(DEFAULT_COMMAND_ARGS);

  // Then
  const hasExpectedNumberOfPosts = posts => posts.length === postsCount;
  const sentMediaPostsByTarget = DEFAULT_TARGET_FEEDS.map(WhatsAppFeedFactory.getSentMediaPosts);
  expect(sentMediaPostsByTarget).toHaveLength(DEFAULT_SYNC_COUNT);
  expect(sentMediaPostsByTarget).toSatisfyAll(hasExpectedNumberOfPosts);
});
