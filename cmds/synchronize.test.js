const _ = require('lodash');
const os = require('os');
const path = require('path');

const { vol } = require('memfs');

const instagramApi = require('instagram-private-api').V1;
const WhatsAppClient = require('../lib/whatsapp');

const synchronize = require('./synchronize');
const SynchronizationState = require('../lib/synchronization-state');

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));
// Instagram Private API and WhatsAppClient mock are defined
// in the __mocks__ folder and are automatically loaded by jest
jest.mock('../lib/whatsapp');
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

const CredentialsDbInitializedWith = (synchronizeOptions) => {
  const credentialsDbFile = path.join(synchronizeOptions.whatsAppDataFolder, 'credentials.db');
  const credentialsDbContent = { [synchronizeOptions.instagramAccount]: 'fakePassword' };

  const volJson = vol.toJSON();
  Object.assign(volJson, {
    [credentialsDbFile]: JSON.stringify(credentialsDbContent),
    [os.tmpdir()]: null,
  });
  vol.fromJSON(volJson);
};

beforeEach(() => {
  vol.reset();
  instagramApi.reset();
  WhatsAppClient.reset();
});


test('synchronize finds and sends all Instagram posts to Whatsapp', async () => {
  // Given
  const postsCount = 10;
  const synchronizeOptions = DEFAULT_SYNCHRONIZE_OPTIONS;
  CredentialsDbInitializedWith(synchronizeOptions);
  instagramApi.configuredWith({ postsCount });

  // When
  await synchronize.handler(synchronizeOptions);

  // Then
  const expectedMediaCaptions = _.range(1, postsCount + 1).map(i => `caption ${i} [location ${i}]`);
  const SentMediaCaptions = _.map(WhatsAppClient.mediaSentByGroup[synchronizeOptions.whatsAppGroup], 'comment');
  expect(SentMediaCaptions).toEqual(expectedMediaCaptions);
});


test('synchronize updates the synchronisation timestamp', async () => {
  // Given
  const postsCount = 5;
  const synchronizeOptions = DEFAULT_SYNCHRONIZE_OPTIONS;
  CredentialsDbInitializedWith(synchronizeOptions);
  instagramApi.configuredWith({ postsCount });

  const { instagramAccount, whatsAppGroup, syncStateFolder } = synchronizeOptions;

  // When
  await synchronize.handler(synchronizeOptions);
  const synchroState = new SynchronizationState(instagramAccount, whatsAppGroup, syncStateFolder);
  await synchroState.loadFromDisk();

  // Then
  expect(synchroState.lastTimestamp).toEqual(postsCount);
});

test('synchronize starts from the last synchronisation timestamp', async () => {
  // Given
  const lastTimestamp = 6;
  const postsCount = 10;

  const synchronizeOptions = DEFAULT_SYNCHRONIZE_OPTIONS;
  CredentialsDbInitializedWith(synchronizeOptions);
  instagramApi.configuredWith({ postsCount });

  const { instagramAccount, whatsAppGroup, syncStateFolder } = synchronizeOptions;
  const synchroState = new SynchronizationState(instagramAccount, whatsAppGroup, syncStateFolder);
  await synchroState.update({ timestamp: lastTimestamp }).saveToDisk();

  // When
  await synchronize.handler(synchronizeOptions);

  // Then
  const sentMedia = WhatsAppClient.mediaSentByGroup[synchronizeOptions.whatsAppGroup];
  const olderThanLastTimestamp = media => parseInt(media.comment.replace('caption ', ''), 10) > lastTimestamp;
  expect(sentMedia.every(olderThanLastTimestamp)).toEqual(true);
  expect(sentMedia.length).toEqual(postsCount - lastTimestamp);
});

test('synchronize shutdown the client afterward', async () => {
  // Given
  const lastTimestamp = 6;
  const postsCount = 10;

  const synchronizeOptions = DEFAULT_SYNCHRONIZE_OPTIONS;
  CredentialsDbInitializedWith(synchronizeOptions);
  instagramApi.configuredWith({ postsCount });

  const { instagramAccount, whatsAppGroup, syncStateFolder } = synchronizeOptions;
  const synchroState = new SynchronizationState(instagramAccount, whatsAppGroup, syncStateFolder);
  await synchroState.update({ timestamp: lastTimestamp }).saveToDisk();

  // When
  await synchronize.handler(synchronizeOptions);

  // Then
  const sentMedia = WhatsAppClient.mediaSentByGroup[synchronizeOptions.whatsAppGroup];
  const olderThanLastTimestamp = media => parseInt(media.comment.replace('caption ', ''), 10) > lastTimestamp;
  expect(sentMedia.every(olderThanLastTimestamp)).toEqual(true);
  expect(sentMedia.length).toEqual(postsCount - lastTimestamp);
});
