#!/usr/bin/env node

const path = require('path');
const loudRejection = require('loud-rejection');

const yargs = require('yargs');
const { getAppDataPath } = require('appdata-path');

const findGoogleChrome = require('./lib/helpers/google-chrome-finder');
const authorizeCmd = require('./cmds/authorize');
const synchronizeCmd = require('./cmds/synchronize');
const synchronizeFromFileCmd = require('./cmds/synchronize-from-file');

const APPLICATION_NAME = 'instawhatsapp';
const APPLICATION_FOLDER = getAppDataPath(APPLICATION_NAME);


loudRejection();

const commonOptions = {
  headless: {
    describe: 'Hide the Google Chrome window used to run WhatsApp Web client',
    type: 'boolean',
    default: true,
  },
  'google-chrome-path': {
    describe: 'Path to Google Chrome executable',
    type: 'string',
    default: findGoogleChrome,
  },
  'sync-state-folder': {
    hidden: true,
    default: path.join(APPLICATION_FOLDER, 'synchroStates'),
  },
  'whats-app-data-folder': {
    hidden: true,
    default: path.join(APPLICATION_FOLDER, 'whatsapp'),
  },
};

// eslint-disable-next-line no-unused-expressions
yargs
  .options(commonOptions)
  .command(synchronizeCmd)
  .command(synchronizeFromFileCmd)
  .command(authorizeCmd)
  .demandCommand()
  .help()
  .strict()
  .argv;
