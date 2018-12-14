const asyncSequentialMap = require('./async-sequential-map');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test('asyncSequentialMap returns a promise', () => {
  // Given
  const asyncFunction = async elt => elt;
  const array = [1, 2, 3];
  // When
  const promise = asyncSequentialMap(array, asyncFunction);
  // Then
  expect(typeof promise.then).toBe('function');
});

test('asyncSequentialMap of an empty array returns a promise that resolves to an empty array', async () => {
  // Given
  const nullAsync = async () => null;
  const emptyArray = [];
  // When
  const promise = asyncSequentialMap(emptyArray, nullAsync);
  // Then
  await expect(promise).resolves.toEqual(emptyArray);
});

test('asyncSequentialMap executes the async function sequentially on the array', async () => {
  // Given
  const doubleArray = [];
  const array = [1, 2, 3, 4];
  const asyncDouble = async elt => doubleArray.push(2 * elt);
  // We introduce an artificial delay to ensure that most of the time
  // the last elt would be treated first if sequential was
  // not properly implemented
  const asyncDoubleWithDelay = async (elt) => {
    const delay = 10 * (array.length - elt);
    if (delay) await sleep(delay);
    return asyncDouble(elt);
  };
  // When
  const promise = asyncSequentialMap(array, asyncDoubleWithDelay);
  // Then
  await promise.then(() => expect(doubleArray).toEqual([2, 4, 6, 8]));
});
