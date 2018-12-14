
// Return a function that, given an array, will returns a promise would
// be resolved after the sequentially execution of the given async function
// on each element of the given array
const asyncSequentialMap = async (elements, asyncFunction) => {
  const results = [];
  const runAsyncFunction = async elt => results.push(await asyncFunction(elt));

  await elements.reduce(
    (previousPromise, elt) => previousPromise.then(() => runAsyncFunction(elt)),
    Promise.resolve(undefined),
  );

  return results;
};

module.exports = asyncSequentialMap;
