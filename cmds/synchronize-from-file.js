const chrono = require('chrono-node');

const synchronizeCommandHandler = require('./synchronize-cmd-handler');


module.exports = {
  command: 'sync-from-file <syncListFile>',
  describe: 'Synchronize Instagram posts with the WhatsApp group',

  builder: {
    'dry-run': {
      describe: 'Only show what posts would be synchronized',
      type: 'boolean',
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

  handler: synchronizeCommandHandler,
};
