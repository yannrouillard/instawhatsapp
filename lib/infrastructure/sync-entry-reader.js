
const os = require('os');
const util = require('util');
const fs = require('fs');

const MediaFeedInfo = require('../media-feed-info');
const splitWithRemainder = require('../helpers/split-with-remainder');

const readFileAsync = util.promisify(fs.readFile);


/* ****************************************************************************
 * Helper functions
 *************************************************************************** */

const isNotEmptyLine = line => !line.match(/^\s*$/);

const isValidSyncEntry = syncEntry => (
  syncEntry.sourceFeedInfo.account
  && syncEntry.targetFeedInfo.account
  && syncEntry.targetFeedInfo.name
);

const parseAccountsInfo = (line) => {
  const [instagramAccount, whatsAppAccount, whatsAppGroup] = splitWithRemainder(line, /\s+/, 3);
  return { instagramAccount, whatsAppAccount, whatsAppGroup };
};

/* ****************************************************************************
 * Public functions
 *************************************************************************** */

const readEntryFromAccountInfo = info => ({
  sourceFeedInfo: new MediaFeedInfo({ account: info.instagramAccount }),
  targetFeedInfo: new MediaFeedInfo({ account: info.whatsAppAccount, name: info.whatsAppGroup }),
});

const readEntriesFromFile = async (syncListFile) => {
  const syncListContent = await readFileAsync(syncListFile, 'utf8');

  const syncList = syncListContent
    .split(os.EOL)
    .filter(isNotEmptyLine)
    .map(parseAccountsInfo)
    .map(readEntryFromAccountInfo);

  if (!syncList.every(isValidSyncEntry)) throw new Error('Invalid Sync file');
  return syncList;
};

module.exports = {
  readEntriesFromFile,
  readEntryFromAccountInfo,
};
