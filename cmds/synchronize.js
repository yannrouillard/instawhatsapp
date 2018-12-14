const chrono = require('chrono-node');
const ellipsis = require('text-ellipsis');
const moment = require('moment');

const SynchronisationStateDb = require('../lib/infrastructure/synchronization-state-db');
const InstagramFeedFactory = require('../lib/infrastructure/instagram-feed-factory');
const WhatsAppFeedFactory = require('../lib/infrastructure/whatsapp-feed-factory');
const { CredentialsDb } = require('../lib/infrastructure/credentials-db');
const MediaFeedInfo = require('../lib/media-feed-info');
const MediaFeedsSynchronizer = require('../lib/media-feeds-synchronizer');

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

const initCredentialsDb = (argv) => {
  const credentialsDb = new CredentialsDb(argv.whatsAppDataFolder);
  if (argv.instagramPassword) {
    credentialsDb.setEphemeralPassword(argv.instagramAccount, argv.instagramPassword);
  }
  return credentialsDb;
};

const createMediaPostsSynchronizer = (argv) => {
  const credentialsDb = initCredentialsDb(argv);
  const instagramFeedFactory = new InstagramFeedFactory(credentialsDb);

  const synchroStateDb = new SynchronisationStateDb(argv.syncStateFolder);
  const whatsAppFeedFactory = new WhatsAppFeedFactory(
    argv.whatsAppDataFolder,
    argv.googleChromePath,
    argv.headless,
  );

  return new MediaFeedsSynchronizer({
    sourceFeedFactory: instagramFeedFactory,
    targetFeedFactory: whatsAppFeedFactory,
    synchroStateDb,
  });
};

/* ****************************************************************************
 * Public functions
 *************************************************************************** */

module.exports = {
  command: 'sync <instagramAccount> <whatsAppAccount> <whatsAppGroup>',
  describe: 'Synchronize Instagram posts with the WhatsApp group',

  builder: {
    'dry-run': {
      describe: 'Only show what posts would be synchronized',
      type: 'boolean',
    },
    'instagram-password': {
      describe: 'Instagram account password',
      type: 'string',
    },
    max: {
      describe: 'Maximum number of posts to synchronize',
      type: 'number',
    },
    since: {
      describe: 'Only synchronize posts published after the given date',
      type: 'string',
      coerce: chrono.parseDate,
    },
  },

  handler: async (argv) => {
    const mediaPostsSynchronizer = createMediaPostsSynchronizer(argv);

    if (!argv.quiet) {
      mediaPostsSynchronizer.on('mediaPostsFound', logMediaPostsFound);
      mediaPostsSynchronizer.on('sendingMediaPost', logSendingMediaPost);
    }

    const synchroOptions = { max: argv.max, since: argv.since, dryRun: argv.dryRun };
    const instagramFeedInfo = new MediaFeedInfo({ account: argv.instagramAccount });
    const whatsAppFeedInfo = new MediaFeedInfo({
      account: argv.whatsAppAccount,
      name: argv.whatsAppGroup,
    });

    await mediaPostsSynchronizer.synchronizeMediaFeeds({
      sourceFeedInfo: instagramFeedInfo,
      targetFeedInfo: whatsAppFeedInfo,
      options: synchroOptions,
    });
  },
};
