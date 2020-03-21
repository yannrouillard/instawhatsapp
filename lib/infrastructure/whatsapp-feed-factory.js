const assert = require('assert');
const path = require('path');

const del = require('del');
const makeDir = require('make-dir');
const puppeteer = require('puppeteer-core');

const downloadImage = require('../helpers/download-image');

/* ****************************************************************************
 * Constant definitions
 *************************************************************************** */

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';
const WHATSAPP_URL = 'https://web.whatsapp.com/';

const CLIP_ICON = "#main span[data-icon='clip']";
const FILE_INPUT = '#main input[accept]';
const IMAGE_ICON = "#main span[data-icon='image']";
const SEND_MEDIA_ICON = "span[data-icon='send-light']";
const SEND_TEXT_ICON = "span[data-icon='send']";
const COMMENT_INPUT = 'div[contenteditable=true][data-tab="1"]';
const QR_CODE_IMG = "img[alt='Scan me!']";
const PANE_SIDE = "div[id='pane-side']";
const GROUP_SELECTOR = 'div[contenteditable=true][data-tab="3"]';

const DEFAULT_TIMEOUT = 120000;

/* ****************************************************************************
 * Helper functions
 *************************************************************************** */

const downloadPostImages = post => Promise.all(post.mediaUrls.map(downloadImage));

/* ****************************************************************************
 * Public functions and classes
 *************************************************************************** */

class WhatsAppFeed {
  constructor(whatsAppFeedInfo, configuration) {
    this.whatsAppAccount = whatsAppFeedInfo.account;
    this.whatsAppGroup = whatsAppFeedInfo.name;
    this.whatsAppDataFolder = configuration.whatsAppDataFolder;
    this.googleChromePath = configuration.googleChromePath;
    this.headless = configuration.headless;

    this.chromeUserDataDir = path.join(this.whatsAppDataFolder, this.whatsAppAccount);
    this.browser = null;
    this.whatsAppPage = null;
    this.timeout = DEFAULT_TIMEOUT;
  }

  async resetAuthorization() {
    // Some precautions to not remove importants files
    // even in case of unexpected bugs
    assert(path.normalize(this.chromeUserDataDir) !== '/');
    assert(path.normalize(this.chromeUserDataDir) !== path.normalize(process.env.HOME));
    // Let's make sure browser is closed before removing its data directory
    await this.close();
    await del(this.chromeUserDataDir, { force: true });
  }

  async getAuthorizationCode() {
    const qrCodeImage = await this._waitFor(QR_CODE_IMG);
    const imageSrcProperty = await qrCodeImage.getProperty('src');
    const imageSrcValue = await imageSrcProperty.jsonValue();
    const imageBase64 = imageSrcValue.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(imageBase64, 'base64');
  }

  async waitForAuthorization() {
    await this._waitFor(PANE_SIDE);
  }

  async sendMediaPost(mediaPost) {
    const comment = mediaPost.title + (mediaPost.location ? ` [${mediaPost.location}]` : '');
    const imagesPaths = await downloadPostImages(mediaPost);

    const page = await this._getWhatsAppPage();
    const groupIcon = `#pane-side span[title='${this.whatsAppGroup}']`;

    const clickElement = element => element.click();
    const focusElement = element => element.focus();
    const enterText = text => () => page.keyboard.type(text);

    await this._waitFor(GROUP_SELECTOR)
      .then(focusElement)
      .then(enterText(this.whatsAppGroup));

    await this._waitFor(groupIcon).then(clickElement);
    await this._waitFor(CLIP_ICON).then(clickElement);

    const uploadImages = () => this._waitFor(FILE_INPUT).then(el => el.uploadFile(...imagesPaths));
    await this._waitFor(IMAGE_ICON)
      .then(clickElement)
      .then(uploadImages);

    // Because of the animation displayed when the send button appears, the click method
    // often clicks the wrong location.
    // We workaround this by using this click function for this icon
    // (unfortunately it doesn't work when used on other elements to be closed)
    // See https://stackoverflow.com/questions/49979069/puppeteer-element-click-not-working-and-not-throwing-an-error
    const clickElementWithAnimWorkaround = element => page.evaluate(el => el.click(), element);

    const sendMedia = () => this._waitFor(SEND_MEDIA_ICON).then(clickElementWithAnimWorkaround);
    await this._runCommandAndWaitUntilUploadFinished(sendMedia);

    await this._waitFor(COMMENT_INPUT)
      .then(focusElement)
      .then(enterText(comment));

    const sendComment = () => this._waitFor(SEND_TEXT_ICON).then(clickElement);
    await this._runCommandAndWaitUntilUploadFinished(sendComment);
  }

  async close() {
    if (this.browser !== null) {
      await this.browser.close();
      this.browser = null;
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
    const waitForUploadFinished = () =>
      page.waitForFunction('!window.onbeforeunload()', {
        timeout: 60000,
      });

    await Promise.all([waitForUploadStarted().then(waitForUploadFinished), puppeteerCommand()]);
  }

  async _waitFor(selector) {
    const page = await this._getWhatsAppPage();
    return page.waitFor(selector, { timeout: this.timeout });
  }

  async _getBrowser() {
    if (this.browser === null) {
      await makeDir(this.chromeUserDataDir);
      this.browser = await puppeteer.launch({
        executablePath: this.googleChromePath,
        headless: this.headless,
        userDataDir: this.chromeUserDataDir,
        // Seems required to have proper Service Worker support
        args: ['--enable-features=NetworkService'],
      });
    }
    return this.browser;
  }

  async _getWhatsAppPage() {
    if (this.whatsAppPage === null) {
      const browser = await this._getBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      // Service Workers give us some headaches probably because of the cache
      // (page about unsupported browser is incorrectly returned form time to time)
      // so we completly reset their states each time until we find a better solution
      await this._resetServiceWorker();
      await page.goto(WHATSAPP_URL, { waitUntil: 'networkidle0', timeout: 0 });
      this.whatsAppPage = page;
    }
    return this.whatsAppPage;
  }

  async _resetServiceWorker() {
    // Would better be replaced with some puppeeter commands
    // but didn't find a better solution for now
    return del(path.join(this.chromeUserDataDir, 'Default', 'Service Worker'), { force: true });
  }
}

class WhatsAppFeedFactory {
  constructor(whatsAppDataFolder, googleChromePath, headless) {
    this.configuration = {
      whatsAppDataFolder,
      googleChromePath,
      headless,
    };
  }

  getFeed(whatsAppFeedInfo) {
    return new WhatsAppFeed(whatsAppFeedInfo, this.configuration);
  }
}

module.exports = WhatsAppFeedFactory;
