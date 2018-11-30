
class WhatsAppClient {
  constructor() {
    WhatsAppClient.shutdown = false;
  }

  // eslint-disable-next-line class-methods-use-this
  async sendMedia(whatsappGroup, imagesPath, comment) {
    if (!WhatsAppClient.mediaSentByGroup[whatsappGroup]) {
      WhatsAppClient.mediaSentByGroup[whatsappGroup] = [];
    }
    WhatsAppClient.mediaSentByGroup[whatsappGroup].push({ images: imagesPath, comment });
  }

  // eslint-disable-next-line class-methods-use-this
  async shutdown() {
    WhatsAppClient.shutdown = true;
  }

  static reset() {
    WhatsAppClient.mediaSentByGroup = {};
  }
}

WhatsAppClient.mediaSentByGroup = {};
WhatsAppClient.shutdown = false;

module.exports = WhatsAppClient;
