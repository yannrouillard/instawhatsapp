
class WhatsAppClient {
  constructor() {
    this.shutdownStatus = false;
  }

  // eslint-disable-next-line class-methods-use-this
  async sendMedia(whatsappGroup, imagesPath, comment) {
    if (!WhatsAppClient.mediaSentByGroup[whatsappGroup]) {
      WhatsAppClient.mediaSentByGroup[whatsappGroup] = [];
    }
    WhatsAppClient.mediaSentByGroup[whatsappGroup].push({ images: imagesPath, comment });
  }

  async shutdown() {
    this.shutdownStatus = true;
  }

  static reset() {
    WhatsAppClient.mediaSentByGroup = {};
  }
}

WhatsAppClient.mediaSentByGroup = {};

module.exports = WhatsAppClient;
