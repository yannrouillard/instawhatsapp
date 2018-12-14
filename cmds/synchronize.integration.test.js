const _ = require('lodash');
const os = require('os');
const path = require('path');

const { vol } = require('memfs');

const instagramPrivateApiMock = require('instagram-private-api').V1;
const WhatsAppFeedFactory = require('../lib/infrastructure/whatsapp-feed-factory');
const MediaFeedInfo = require('../lib/media-feed-info');

const synchronize = require('./synchronize');

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));
// Instagram Private API and WhatsAppClient mock are defined
// in the __mocks__ folder and are automatically loaded by jest
jest.mock('../lib/infrastructure/whatsapp-feed-factory');
jest.mock('instagram-private-api');


const DEFAULT_SYNCHRONIZE_OPTIONS = {
  instagramAccount: 'fakeAccount',
  whatsAppGroup: 'fakeWhatsAppGroup',
  whatsAppAccount: 'fakeWhatsAppAccount',
  googleChromePath: '/path/to/Google/Chrome',
  whatsAppDataFolder: '/path/to/whatsapp/data/folder',
  syncStateFolder: '/path/to/sync/state/folder',
  quiet: true,
};

const TARGET_FEED_INFO = new MediaFeedInfo({
  account: DEFAULT_SYNCHRONIZE_OPTIONS.whatsAppAccount,
  name: DEFAULT_SYNCHRONIZE_OPTIONS.whatsAppGroup,
});

const CredentialsDbInitializedWith = (synchronizeOptions) => {
  const credentialsDbFile = path.join(synchronizeOptions.whatsAppDataFolder, 'credentials.db');
  const credentialsDbContent = synchronizeOptions.instagramPassword
    ? {}
    : { [synchronizeOptions.instagramAccount]: 'fakePassword' };

  const volJson = vol.toJSON();
  Object.assign(volJson, {
    [credentialsDbFile]: JSON.stringify(credentialsDbContent),
    [os.tmpdir()]: null,
  });
  vol.fromJSON(volJson);
};

beforeEach(() => {
  vol.reset();
  instagramPrivateApiMock.reset();
  WhatsAppFeedFactory.reset();
});


test('synchronize finds and sends all Instagram posts to Whatsapp', async () => {
  // Given
  const postsCount = 10;
  const synchronizeOptions = DEFAULT_SYNCHRONIZE_OPTIONS;
  CredentialsDbInitializedWith(synchronizeOptions);
  instagramPrivateApiMock.configuredWith({ postsCount });

  // When
  await synchronize.handler(synchronizeOptions);

  // Then
  const sentMediaPosts = WhatsAppFeedFactory.getSentMediaPosts(TARGET_FEED_INFO);
  const sentMediaPostsTitles = _.map(sentMediaPosts, 'title');
  const expectedTitles = _.range(1, postsCount + 1).map(i => `caption ${i}`);
  expect(sentMediaPostsTitles).toEqual(expectedTitles);
});

test('synchronize properly use the given instagram password if present', async () => {
  // Given
  const postsCount = 10;
  const specificOptions = { instagramPassword: 'fakePassword' };
  const synchronizeOptions = { ...DEFAULT_SYNCHRONIZE_OPTIONS, ...specificOptions };
  CredentialsDbInitializedWith(synchronizeOptions);
  instagramPrivateApiMock.configuredWith({ postsCount });

  // When and Then
  expect(async () => synchronize.handler(synchronizeOptions)).not.toThrow();
});
