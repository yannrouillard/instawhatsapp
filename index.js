const path = require('path');
const loudRejection = require('loud-rejection');

const yargs = require('yargs');
const { getAppDataPath } = require('appdata-path');

const findGoogleChrome = require('./lib/google-chrome-finder');
const authorizeCmd = require('./cmds/authorize');
const synchronizeCmd = require('./cmds/synchronize');

const APPLICATION_NAME = 'instawhatsapp';

loudRejection();

const commonOptions = {
  'no-headless': {
    describe: 'Display the Google Chrome window used to run WhatsApp Web client',
  },
  'google-chrome-path': {
    describe: 'Path to Google Chrome executable',
    type: 'string',
    default: findGoogleChrome,
  },
  'whats-app-data-folder': {
    hidden: true,
    default: path.join(getAppDataPath(APPLICATION_NAME), 'whatsapp'),
  },
};

// eslint-disable-next-line no-unused-expressions
yargs
  .options(commonOptions)
  .command(synchronizeCmd)
  .command(authorizeCmd)
  .demandCommand()
  .help()
  .argv;
