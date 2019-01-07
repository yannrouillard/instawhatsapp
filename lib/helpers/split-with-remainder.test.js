const splitWithRemainder = require('./split-with-remainder');

const LINE_TO_SPLIT = 'abc def ghi';

test('splitWithRemainder returns proper elements with string separator', () => {
  // given
  const separator = ' ';
  // When
  const splittedElements = splitWithRemainder(LINE_TO_SPLIT, separator);
  // Then
  expect(splittedElements).toEqual(['abc', 'def', 'ghi']);
});

test('splitWithRemainder properly handle string separator using regexp characters', () => {
  // given
  const lineToSplit = 'abc.def.ghi';
  const separator = '.';
  // When
  const splittedElements = splitWithRemainder(lineToSplit, separator);
  // Then
  expect(splittedElements).toEqual(['abc', 'def', 'ghi']);
});

test('splitWithRemainder returns proper elements with regexp separator', () => {
  // given
  const separator = /\s+/;
  // When
  const splittedElements = splitWithRemainder(LINE_TO_SPLIT, separator);
  // Then
  expect(splittedElements).toEqual(['abc', 'def', 'ghi']);
});

test('splitWithRemainder returns only limit elements if limit is given', () => {
  // Given
  const separator = /\s+/;
  const limit = 2;
  // When
  const splittedElements = splitWithRemainder(LINE_TO_SPLIT, separator, limit);
  // Then
  expect(splittedElements.length).toEqual(limit);
});

test('splitWithRemainder returns remaining elements in the last list element', () => {
  // Given
  const lineToSplit = 'abc def ghi jkl';
  const separator = /\s+/;
  const limit = 3;
  // When
  const splittedElements = splitWithRemainder(lineToSplit, separator, limit);
  // Then
  expect(splittedElements).toEqual(['abc', 'def', 'ghi jkl']);
});

test('splitWithRemainder correctly preserves split in remainder', () => {
  // Given
  const lineToSplit = 'abc def ghi    jkl';
  const separator = /\s+/;
  const limit = 3;
  // When
  const splittedElements = splitWithRemainder(lineToSplit, separator, limit);
  // Then
  expect(splittedElements).toEqual(['abc', 'def', 'ghi    jkl']);
});

test('splitWithRemainder with limit set to 0 returns empty list', () => {
  // Given
  const separator = /\s+/;
  const limit = 0;
  // When
  const splittedElements = splitWithRemainder(LINE_TO_SPLIT, separator, limit);
  // Then
  expect(splittedElements).toEqual([]);
});

test('splitWithRemainder with limit greater than list size return entire list', () => {
  // Given
  const lineToSplit = 'abc def ghi jkl';
  const separator = /\s+/;
  const limit = 10;
  // When
  const splittedElements = splitWithRemainder(lineToSplit, separator, limit);
  // Then
  expect(splittedElements).toEqual(['abc', 'def', 'ghi', 'jkl']);
});
