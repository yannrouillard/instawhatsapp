const path = require('path');

const makeDir = require('make-dir');
const puppeteer = require('puppeteer-core');

/* ****************************************************************************
 * Constant definitions
 *************************************************************************** */

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';
const WHATSAPP_URL = 'https://web.whatsapp.com/';

const CLIP_ICON = "#main span[data-icon='clip']";
const FILE_INPUT = '#main input[accept]';
const IMAGE_ICON = "#main span[data-icon='image']";
const SEND_MEDIA_ICON = "span[data-icon='send-light']";
const SEND_TEXT_ICON = "span[data-icon='send']";
const COMMENT_INPUT = "div[contenteditable='true']";
const AUTH_TIMEOUT_ELEMENT = '#hard_expire_time';
const QR_CODE_IMG = "img[alt='Scan me!']";
const PANE_SIDE = "div[id='pane-side']";
const GROUP_SELECTOR = 'input[type="text"]';

const DEFAULT_TIMEOUT = 120000;

/* ****************************************************************************
 * Public functions
 *************************************************************************** */

class WhatsAppClient {
  constructor({ whatsAppAccount, whatsAppDataFolder, googleChromePath, headless }) {
    this.whatsAppAccount = whatsAppAccount;
    this.whatsAppDataFolder = whatsAppDataFolder;
    this.googleChromePath = googleChromePath;
    this.headless = headless !== undefined ? headless : true;

    this._chromeUserDataDir = path.join(this.whatsAppDataFolder, this.whatsAppAccount);
    this._browser = null;
    this._whatsAppPage = null;
    this._timeout = DEFAULT_TIMEOUT;
  }

  async requiresAuthorization() {
    const page = await this._getWhatsAppPage();
    const authTimeOutElement = await page.$(AUTH_TIMEOUT_ELEMENT);
    return (authTimeOutElement !== null);
  }

  async getAuthorizationQRCode() {
    const qrCodeImage = await this._waitFor(QR_CODE_IMG);
    const imageSrcProperty = await qrCodeImage.getProperty('src');
    const imageSrcValue = await imageSrcProperty.jsonValue();
    const imageBase64 = imageSrcValue.replace(/^data:image\/png;base64,/, '');
    const image = Buffer.from(imageBase64, 'base64');
    return image;
  }

  async waitForAuthorization() {
    await this._waitFor(PANE_SIDE);
  }

  async sendMedia(whatsappGroup, imagesPath, comment) {
    const page = await this._getWhatsAppPage();
    const groupIcon = `#pane-side span[title='${whatsappGroup}']`;

    const clickElement = element => element.click();
    const focusElement = element => element.focus();
    const enterText = text => () => page.keyboard.type(text);

    await this._waitFor(GROUP_SELECTOR).then(focusElement).then(enterText(whatsappGroup));

    await this._waitFor(groupIcon).then(clickElement);
    await this._waitFor(CLIP_ICON).then(clickElement);

    const uploadImages = () => this._waitFor(FILE_INPUT).then(in_ => in_.uploadFile(...imagesPath));
    await this._waitFor(IMAGE_ICON).then(clickElement).then(uploadImages);

    // Because of the animation displayed when the send button appears, the click method
    // often clicks the wrong location.
    // We workaround this by using this click function for this icon
    // (unfortunately it doesn't work when used on other elements to be closed)
    // See https://stackoverflow.com/questions/49979069/puppeteer-element-click-not-working-and-not-throwing-an-error
    const clickElementWithAnimWorkaround = element => page.evaluate(el => el.click(), element);

    const sendMedia = () => this._waitFor(SEND_MEDIA_ICON).then(clickElementWithAnimWorkaround);
    await this._runCommandAndWaitUntilUploadFinished(sendMedia);

    await this._waitFor(COMMENT_INPUT).then(focusElement).then(enterText(comment));

    const sendComment = () => this._waitFor(SEND_TEXT_ICON).then(clickElement);
    await this._runCommandAndWaitUntilUploadFinished(sendComment);
  }

  async shutdown() {
    if (this._browser !== null) {
      await this._browser.close();
      this._browser = null;
    }
  }

  /*
   *  Private methods
   */

  async _runCommandAndWaitUntilUploadFinished(puppeteerCommand) {
    const page = await this._getWhatsAppPage();

    // Whatsapp Web client onbeforeunload handler returns a string to prevent page
    // from being closed while an upload is in progress, so we check the output of
    // the handler to check if there is an ongoing upload
    const waitForUploadStarted = () => page.waitForFunction('window.onbeforeunload()');
    const waitForUploadFinished = () => page.waitForFunction('!window.onbeforeunload()', {
      timeout: 60000,
    });

    await Promise.all([
      waitForUploadStarted().then(waitForUploadFinished),
      puppeteerCommand(),
    ]);
  }

  async _waitFor(selector) {
    const page = await this._getWhatsAppPage();
    return page.waitFor(selector, { timeout: this._timeout });
  }

  async _getBrowser() {
    if (this._browser === null) {
      await makeDir(this._chromeUserDataDir);
      this._browser = await puppeteer.launch({
        executablePath: this.googleChromePath,
        headless: this.headless,
        userDataDir: this._chromeUserDataDir,
      });
    }
    return this._browser;
  }

  async _getWhatsAppPage() {
    if (this._whatsAppPage === null) {
      const browser = await this._getBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      await page.goto(WHATSAPP_URL, { waitUntil: 'networkidle0', timeout: 0 });
      this._whatsAppPage = page;
    }
    return this._whatsAppPage;
  }
}

module.exports = WhatsAppClient;
