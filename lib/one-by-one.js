
// Return a function that, given an array, will returns a promise would
// be resolved after the sequentially execution of the given async function
// on each element of the given array
const oneByOne = asyncFunction => elements => (
  elements.reduce(
    (previousPromise, elt) => previousPromise.then(() => asyncFunction(elt)),
    Promise.resolve(undefined),
  )
);

module.exports = oneByOne;
