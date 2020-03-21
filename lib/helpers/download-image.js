const path = require('path');
const url = require('url');
const download = require('download');
const tmp = require('tmp-promise');

let temporaryFolder = null;

const _createTemporaryFolder = async () => {
  if (temporaryFolder === null) {
    temporaryFolder = await tmp.dir({ unsafeCleanup: true });
  }
  return temporaryFolder;
};

const downloadImage = async imageUrl => {
  const downloadFolder = await _createTemporaryFolder();
  const imagePath = new url.URL(imageUrl).pathname;
  await download(imageUrl, downloadFolder.path);
  return path.join(downloadFolder.path, path.basename(imagePath));
};

module.exports = downloadImage;
