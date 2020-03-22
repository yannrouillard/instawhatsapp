const { vol } = require('memfs');

const syncEntryReader = require('./sync-entry-reader');

// eslint-disable-next-line global-require
jest.mock('fs', () => require('memfs'));

const SYNC_LIST_FILE = '/syncListFile';

const SYNC_LIST_FILE_CONTENT = `
fakeInstagramAccount0 fakeWhatsAppAccount0 fakeWhatsAppGroup0
fakeInstagramAccount1 fakeWhatsAppAccount1 fakeWhatsAppGroup1
fakeInstagramAccount2 fakeWhatsAppAccount2 fakeWhatsAppGroup2
`;

const SYNC_LIST_FILE_CONTENT_WITH_EMPTY_LINES = `
fakeInstagramAccount0 fakeWhatsAppAccount0 fakeWhatsAppGroup0

fakeInstagramAccount1 fakeWhatsAppAccount1 fakeWhatsAppGroup1

fakeInstagramAccount2 fakeWhatsAppAccount2 fakeWhatsAppGroup2

`;

const SYNC_LIST_FILE_CONTENT_WITH_INVALID_LINES = `
fakeInstagramAccount0 fakeWhatsAppAccount0 fakeWhatsAppGroup0

fakeInstagramAccount1 fakeWhatsAppAccount1

fakeInstagramAccount2 fakeWhatsAppAccount2 fakeWhatsAppGroup2

`;

const SYNC_LIST_FILE_CONTENT_WITH_SPACE_IN_GROUP_NAME = `
fakeInstagramAccount fakeWhatsAppAccount fake  WhatsApp  Group
`;

const checkSyncEntry = (syncEntry, index = '') => {
  expect(syncEntry.sourceFeedInfo.account).toEqual(`fakeInstagramAccount${index}`);
  expect(syncEntry.targetFeedInfo.account).toEqual(`fakeWhatsAppAccount${index}`);
  expect(syncEntry.targetFeedInfo.name).toEqual(`fakeWhatsAppGroup${index}`);
};

beforeEach(() => vol.reset());

// eslint-disable-next-line jest/expect-expect
test('readEntryFromAccountInfo creates syncEntry from instagram / whatsApp feed info', () => {
  // Given
  const accountInfo = {
    instagramAccount: 'fakeInstagramAccount',
    whatsAppAccount: 'fakeWhatsAppAccount',
    whatsAppGroup: 'fakeWhatsAppGroup',
  };
  // When
  const syncEntry = syncEntryReader.readEntryFromAccountInfo(accountInfo);
  // Then
  checkSyncEntry(syncEntry);
});

// eslint-disable-next-line jest/expect-expect
test('readEntriesFromFile return lists of Sync entries', async () => {
  // Given
  vol.fromJSON({ [SYNC_LIST_FILE]: SYNC_LIST_FILE_CONTENT }, '/');
  // When
  const syncList = await syncEntryReader.readEntriesFromFile(SYNC_LIST_FILE);
  // Then
  syncList.forEach(checkSyncEntry);
});

// eslint-disable-next-line jest/expect-expect
test('readEntriesFromFile ignore empty lines', async () => {
  // Given
  vol.fromJSON({ [SYNC_LIST_FILE]: SYNC_LIST_FILE_CONTENT_WITH_EMPTY_LINES }, '/');
  // When
  const syncList = await syncEntryReader.readEntriesFromFile(SYNC_LIST_FILE);
  // Then
  syncList.forEach(checkSyncEntry);
});

test('readEntriesFromFile raise exceptions when invalid lines are present', async () => {
  // Given
  vol.fromJSON({ [SYNC_LIST_FILE]: SYNC_LIST_FILE_CONTENT_WITH_INVALID_LINES }, '/');
  // When and Then
  const throwingPromise = syncEntryReader.readEntriesFromFile(SYNC_LIST_FILE);
  await expect(throwingPromise).rejects.toThrow(Error);
});

test('readEntriesFromFile handles space in group name', async () => {
  // Given
  vol.fromJSON({ [SYNC_LIST_FILE]: SYNC_LIST_FILE_CONTENT_WITH_SPACE_IN_GROUP_NAME }, '/');
  // When
  const syncList = await syncEntryReader.readEntriesFromFile(SYNC_LIST_FILE);
  // Then
  expect(syncList[0].targetFeedInfo.name).toEqual('fake  WhatsApp  Group');
});
