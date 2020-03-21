const fs = require('fs');
const os = require('os');

const DEFAULT_GOOGLE_CHROME_PATH = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
};

const fileExists = filePath => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return false;
  }
};

const findGoogleChrome = chromePath => {
  const googleChromePath = chromePath || DEFAULT_GOOGLE_CHROME_PATH[os.platform()];

  if (!googleChromePath) throw new Error("OS unknown, couldn't guess Google Chrome Path");
  if (!fileExists(googleChromePath)) throw new Error("Couldn't find Google Chrome Path");

  return googleChromePath;
};

module.exports = findGoogleChrome;
