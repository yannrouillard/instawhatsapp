const terminalImage = require('terminal-image');

const MediaFeedInfo = require('../lib/media-feed-info');
const WhatsAppFeedFactory = require('../lib/infrastructure/whatsapp-feed-factory');


const showQRCode = async (authorizationCode) => {
  // Authorization code is a QR code image for WhatsApp
  const qrCodeImg = authorizationCode;
  console.log('To authorize instawhatsapp, scan the following QR code with the WhatsApp mobile app:');
  process.stdout.write(await terminalImage.buffer(qrCodeImg));
};

module.exports = {
  command: 'authorize <whatsAppAccount>',
  describe: 'Authorize instawhatsapp to access WhatsApp through WhatsApp Web client',

  handler: async (argv) => {
    const whatsAppFeedFactory = new WhatsAppFeedFactory(
      argv.whatsAppDataFolder,
      argv.googleChromePath,
      argv.headless,
    );
    const whatsAppFeedInfo = new MediaFeedInfo({ account: argv.whatsAppAccount });
    const whatsAppFeed = whatsAppFeedFactory.getFeed(whatsAppFeedInfo);
    try {
      await whatsAppFeed.resetAuthorization();
      const authorizationCode = await whatsAppFeed.getAuthorizationCode();
      await showQRCode(authorizationCode);
      await whatsAppFeed.waitForAuthorization();
    } finally {
      await whatsAppFeed.close();
    }
  },
};
