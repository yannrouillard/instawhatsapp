const _ = require('lodash');

const isRegexp = object => object instanceof RegExp;

const getRegexpSeparatorWithDelimiterCapture = separator => {
  const regexString = isRegexp(separator) ? separator.source : _.escapeRegExp(separator);
  return new RegExp(`(${regexString})`);
};

const splitWithRemainder = (string, separator, limit = -1) => {
  const regexSeparatorWithDelimiterCapture = getRegexpSeparatorWithDelimiterCapture(separator);
  const elementsAndDelimiters = string.split(regexSeparatorWithDelimiterCapture);

  const isSeparator = elt => (isRegexp(separator) ? elt.match(separator) : elt === separator);
  const getRemainingElements = index => elementsAndDelimiters.slice(index).join('');

  const extractElementsAndRemainder = (prev, curr, index) => {
    const remainingExpectedElements = limit - prev.length;
    if (remainingExpectedElements && !isSeparator(curr)) {
      const element = remainingExpectedElements === 1 ? getRemainingElements(index) : curr;
      prev.push(element);
    }
    return prev;
  };

  return elementsAndDelimiters.reduce(extractElementsAndRemainder, []);
};

module.exports = splitWithRemainder;
