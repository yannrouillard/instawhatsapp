const terminalImage = require('terminal-image');

const WhatsAppClient = require('../lib/whatsapp');


const showQRCode = async (image) => {
  console.log('To authorize instawhatsapp, scan the following QR code with the WhatsApp mobile app:');
  process.stdout.write(await terminalImage.buffer(image));
};

module.exports = {
  command: 'authorize <whatsAppAccount>',
  describe: 'Authorize instawhatsapp to access WhatsApp through WhatsApp Web client',

  handler: async (argv) => {
    const { whatsAppAccount, googleChromePath, whatsAppDataFolder, headless } = argv;
    const whatsAppClient = new WhatsAppClient({
      whatsAppAccount, googleChromePath, whatsAppDataFolder, headless,
    });

    return whatsAppClient.getAuthorizationQRCode()
      .then(showQRCode)
      .then(() => whatsAppClient.waitForAuthorization())
      .finally(() => whatsAppClient.shutdown());
  },
};
