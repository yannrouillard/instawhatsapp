const oneByOne = require('./one-by-one');

test('oneByOne returns a promise', () => {
  // Given
  const asyncFunction = async elt => elt;
  const array = [1, 2, 3];
  // When
  const promise = oneByOne(asyncFunction)(array);
  // Then
  expect(typeof promise.then).toBe('function');
});

test('oneByOne of an empty array returns a promise that resolves to undefined', async () => {
  // Given
  const nullAsync = async () => null;
  const emptyArray = [];
  // When
  const promise = oneByOne(nullAsync)(emptyArray);
  // Then
  await expect(promise).resolves.toEqual(undefined);
});

test('oneByOne executes the async function sequentially on the array', async () => {
  // Given
  const doubleArray = [];
  const array = [1, 2, 3, 4];
  const doubleAsync = elt => doubleArray.push(2 * elt);
  // When
  const promise = oneByOne(doubleAsync)(array);
  // Then
  await promise.then(() => expect(doubleArray).toEqual([2, 4, 6, 8]));
});
