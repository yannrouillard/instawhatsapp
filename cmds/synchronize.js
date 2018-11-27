const path = require('path');

const chrono = require('chrono-node');
const moment = require('moment');
const ellipsis = require('text-ellipsis');

const SynchronisationState = require('../lib/synchronization-state');
const InstagramClient = require('../lib/instagram');
const WhatsAppClient = require('../lib/whatsapp');
const CredentialsDb = require('../lib/credentials-db');
const downloadImage = require('../lib/download-image');
const oneByOne = require('../lib/one-by-one');

const downloadPostImages = post => Promise.all(post.mediaUrls.map(downloadImage));


module.exports = {
  command: 'sync <instagramAccount> <whatsAppAccount> <whatsAppGroup>',
  describe: 'Synchronize Instagram posts with the WhatsApp group',

  builder: {
    'dry-run': {
      describe: 'Only show what posts would be synchronized',
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
    const { instagramAccount, whatsAppGroup } = argv;
    const { whatsAppAccount, googleChromePath, whatsAppDataFolder, headless } = argv;
    const syncStateFolder = argv.syncStateFolder || path.join(argv.whatsAppDataFolder, 'synchroStates');

    const credentialsDb = new CredentialsDb(argv.whatsAppDataFolder);
    const instagramPassword = argv.instagramPassword || credentialsDb.getPassword(instagramAccount);

    const synchroState = new SynchronisationState(instagramAccount, whatsAppGroup, syncStateFolder);
    const instagramClient = new InstagramClient(instagramAccount, instagramPassword);
    const whatsAppClient = new WhatsAppClient({
      whatsAppAccount, googleChromePath, whatsAppDataFolder, headless,
    });

    await synchroState.loadFromDisk();
    const since = argv.since || synchroState.lastTimestamp;

    const logPostsFound = async (posts) => {
      if (!argv.quiet) {
        console.log(`${posts.length} posts found to be published`);
      }
      return posts;
    };

    const sendOnePost = async (post) => {
      if (!argv.quiet) {
        console.log(`Uploading post "${ellipsis(post.title, 40)}" published on ${moment(post.timestamp).format('LLLL')}`);
      }
      if (argv.dryRun) return;
      const comment = post.title + (post.location ? ` [${post.location}]` : '');
      const imagesPaths = await downloadPostImages(post);
      await whatsAppClient.sendMedia(whatsAppGroup, imagesPaths, comment);
      await synchroState.update(post).saveToDisk();
    };

    return instagramClient.getPosts(since, argv.max)
      .then(logPostsFound)
      .then(oneByOne(sendOnePost))
      .finally(() => whatsAppClient.shutdown());
  },
};
