const ellipsis = require('text-ellipsis');
const moment = require('moment');

const SynchronisationStateDb = require('../lib/infrastructure/synchronization-state-db');
const InstagramFeedFactory = require('../lib/infrastructure/instagram-feed-factory');
const WhatsAppFeedFactory = require('../lib/infrastructure/whatsapp-feed-factory');
const { CredentialsDb } = require('../lib/infrastructure/credentials-db');
const MediaFeedsSynchronizer = require('../lib/media-feeds-synchronizer');
const asyncSequentialMap = require('../lib/helpers/async-sequential-map');

const syncEntryReader = require('../lib/infrastructure/sync-entry-reader');


/* ****************************************************************************
 * Helper functions
 *************************************************************************** */

const logMediaPostsFound = posts => console.log(`${posts.length} posts found to be published`);

const logSendingMediaPost = (post) => {
  console.log(
    `Uploading post "${ellipsis(post.title, 40)}" published on ${moment(post.timestamp).format(
      'LLLL',
    )}`,
  );
};

const buildMediaFeedsSynchronizer = (argv) => {
  const credentialsDb = new CredentialsDb(argv.whatsAppDataFolder);
  if (argv.instagramPassword) {
    credentialsDb.setEphemeralPassword(argv.instagramAccount, argv.instagramPassword);
  }

  const instagramFeedFactory = new InstagramFeedFactory(credentialsDb);
  const whatsAppFeedFactory = new WhatsAppFeedFactory(
    argv.whatsAppDataFolder,
    argv.googleChromePath,
    argv.headless,
  );
  const synchroStateDb = new SynchronisationStateDb(argv.syncStateFolder);

  return new MediaFeedsSynchronizer({
    sourceFeedFactory: instagramFeedFactory,
    targetFeedFactory: whatsAppFeedFactory,
    synchroStateDb,
  });
};

const getMediaFeedsSyncListFromFile = async syncListFile => (
  syncEntryReader.readEntriesFromFile(syncListFile)
);

const getMediaFeedsSyncListFromArgs = (argv) => {
  const accountInfo = {
    instagramAccount: argv.instagramAccount,
    whatsAppAccount: argv.whatsAppAccount,
    whatsAppGroup: argv.whatsAppGroup,
  };
  return [syncEntryReader.readEntryFromAccountInfo(accountInfo)];
};

/* ****************************************************************************
 * Public functions
 *************************************************************************** */

const synchronizeHandler = async (argv) => {
  const mediaFeedsSynchronizer = buildMediaFeedsSynchronizer(argv);

  if (!argv.quiet) {
    mediaFeedsSynchronizer.on('mediaPostsFound', logMediaPostsFound);
    mediaFeedsSynchronizer.on('sendingMediaPost', logSendingMediaPost);
  }

  const synchroOptions = { max: argv.max, since: argv.since, dryRun: argv.dryRun };
  const mediaFeedsSyncList = argv.syncListFile
    ? await getMediaFeedsSyncListFromFile(argv.syncListFile)
    : getMediaFeedsSyncListFromArgs(argv);

  const runMediaFeedsSynchro = async syncEntry => mediaFeedsSynchronizer.synchronizeMediaFeeds({
    sourceFeedInfo: syncEntry.sourceFeedInfo,
    targetFeedInfo: syncEntry.targetFeedInfo,
    options: synchroOptions,
  });

  await asyncSequentialMap(mediaFeedsSyncList, runMediaFeedsSynchro);
};

module.exports = synchronizeHandler;
