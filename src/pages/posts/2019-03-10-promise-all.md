---
layout: post
title:  "Implementing Promise.all"
date:   2019-3-10 11:00:00
categories: programming javascript
banner: https://s3-us-west-2.amazonaws.com/copperwall-blog-images/copperwall-dev/promise-all.png
---

Promise.all is a static method on the Promise object that takes a list of items and returns a promise that resolves with a list containing the values of all resolved values in the input list. If any of the values are rejected promises, the returned promise will also be rejected with the rejection message of the promise that is rejected first. This is particularly helpful for when you want to run multiple promises concurrently, but wait until all of them have been fulfilled before continuing.

If you're using promises directly in your code you may write something like this to make multiple concurrent requests to different API endpoints, and wait until all have completed to operate on the responses.

~~~js
Promise.all([
    fetch('/api/a'),
    fetch('/api/b'),
    fetch('/api/c')
]).then([responseA, responseB, responseC] => {
    // Use the responses from all three async requests.
});
~~~

You can also use Promise.all in async functions if you want multiple async function calls to operate concurrently instead of running them sequentially. In the following code snippet two network requests are made, but the second isn't initiated until the first one completes. This means that if the first request takes five seconds and the second request takes five seconds, the section after the requests have completed will have to wait for the sum of the request times to run.

~~~js
// This waits for the result of the first fetch
// before starting the second fetch.
async function doSomeThings() {
    const result1 = await fetch('/api/a');
    const result2 = await fetch('/api/b');
    
    return {
        ...result1,
        ...result2
    };
}
~~~

In this example both network requests are initiated at the same time. If both requests take five seconds, the section after the requests have completed will have to wait for the maxiumum of the request times to run.

~~~js
// Both fetches are initiated concurrently, but the function waits for
// both to complete before continuing.
async function doSomeThings() {
    // Because we don't await the fetch,
    // we get the promise, not the resolved value.
    const resultPromise1 = fetch('/api/a');
    const resultPromise2 = fetch('/api/b');
    
    // We can await the resulting promise from the
    // two fetches before continuing.
    try {
        const [ result1, result2 ] = Promise.all([resultPromise1, resultPromise2]);    
    } catch (e) {
        // If either request fails, we can catch the error.
        debug('There was an error', e.message);
    }
    
    return {
        ...result1,
        ...result2
    };
}
~~~

It's important to remember that if any of the values in the list passed to Promise.all settle to rejected promises, the entire result will be a rejected Promise.

I thought it'd be neat to go over some possible implementations for Promise.all.

## Recursive Solution

Promise.all can be implemented using a recursive solution. The base case is when Promise.all is called with an empty array, in which case it returns a promise that resolves to an empty array. Otherwise it take the resolved value of the first item in the list and calls Promise.all on the rest of the elements in the list.

~~~js
Promise.all = function promiseAllRecursive(values) {
    // Base case.
    if (values.length === 0) {
        return Promise.resolve([]);
    }
    
    const [first, ...rest] = values;
    
    // Calling Promise.resolve on the first value because it could
    // be either a Promise or an actual value.
    return Promise.resolve(first).then(firstResult => {
        return promiseAllRecursive(rest).then(restResults => {
            return [firstResult, ...restResults];
        });
    });
}
~~~

## Iterative Solution

For the iterative solution, you'll want to return a new promise that only resolves once each of the values of the array provided has resolved, and rejects if any of the promises reject.

The executor function given to your function can keep track of the results as each promise resolves and keep track of the number of promises that have resolved. You can use a for loop or a forEach to iterate over the list of values and call the _then_ method on each of them, adding the result to the results list as they resolve. It's important to remember that Promise.all maintains the order of the results from the promises provided as input, so you can't just append to the results list whenever a promise resolves. You'll need to know the index of the promise that is resolving in order to know where to place it in the results list. In the example I'm doing this by taking the _index_ argument to the _forEach_ callback.

~~~js
Promise.all = function promiseAllIterative(values) {
    return new Promise((resolve, reject) => {
       let results = [];
       let completed = 0;
       
       values.forEach((value, index) => {
            Promise.resolve(value).then(result => {
                results[index] = result;
                completed += 1;
                
                if (completed == values.length) {
                    resolve(results);
                }
            }).catch(err => reject(err));
       });
    });
}
~~~

## Reducer Solution

Yet another way to implement Promise.all is to use a reduce function. The initial value for the reduce function will be a Promise that resolves to an empty list, in a similar fashion to the base case to the recursive solution. Our reducer function will take an accumulator, which will be a promise that will resolve to all of the results of the resolved values so far, and a value argument, which is the current value in the iteration on the list of values (promise or not) to Promise.all. The reducer function should return a new promise that will resolve to the list of results that the accumulator will resolve to, as well as the result that the current value will resolve to. As the reducer iterates over the list of values, each return value will be a promise that resolves to a larger subset of the results of the values passed to Promise.all.

We don't need to explicitly handle catching promise rejecting because the promise we return will be implicitly rejected.

~~~js
Promise.all = function promiseAllReduce(values) {
    return values.reduce((accumulator, value) => {
        return accumulator.then(results => {
            return Promise.resolve(value).then(result => {
                return [...results, result];
            });
        });
    }, Promise.resolve([]));
}
~~~

## Implementations from Promise libraries

### Bluebird Implementation

[Bluebird](http://bluebirdjs.com/docs/getting-started.html) is a pretty common Promise library to use outside of the Promise implementation provided by most JS environments. Their [design principles](http://bluebirdjs.com/docs/why-bluebird.html) include taking the pragmatic or performance-oriented approach over elegant solutions, so it should be interesting to see how they implement Promise.all.

Bluebird's implementation of Promise.all works by creating a [_PromiseArray_](https://github.com/petkaantonov/bluebird/blob/master/src/promise_array.js) instance and returning a promise from that, so it looks like most of the implementation details will be involved with initializing a PromiseArray from a list of values.

#### [PromiseArray](https://github.com/petkaantonov/bluebird/blob/master/src/promise_array.js#L19-L30)

The PromiseArray constructor takes a _values_ parameter, which can either be an Iterator of any value (this includes both promises and concrete values), or a Promise that resolves to an Iterator. The constructor sets up the following instance fields
* _promise (a new promise that'll be used to return from PromiseArray.prototype.promise())
* _values (the values passed to Promise.all)
* _length (initialized to 0, set to the length of values later on)
* _totalResolved (initialized to 0, incremented on promise fulfillment)

After initializing these fields, the constructor calls the __init_ method.

#### [_init](https://github.com/petkaantonov/bluebird/blob/master/src/promise_array.js#L41-L86)

The __init_ method does some setup and error checking on the _values_ input. It checks if _values_ is a promise and sets up the promise to call __init_ when the promise resolves. It will also check if the promise is already rejected or fulfilled, so that it can either immediately reject the return promise or immediately set the _values field to the fulfilled value of the input promise.

If the _values_ argument isn't a promise, Bluebird tries to convert it to an array. If the conversion fails, the return promise is immediately rejected. If the list is empty, the return promise is immediately resolved with an empty list.

If the _values_ argument is a list with more than zero elements, the list is passed to the __iterate_ method.

#### [_iterate](https://github.com/petkaantonov/bluebird/blob/master/src/promise_array.js#L88-L127)

The __iterate_ method does a lot of the heavy lifting for PromiseArray. Each item in the _values_ argument is passed to _tryConvertToPromise_. If the result is a promise, a local bitField variable is set to the bitField of the promise, otherwise the bitField is set to null. The bitField is later used to determine the resolution status of the promise (i.e. whether it's pending, fulfilled, or rejected).

Following that logic, there are cases to handle what to do based on the promise's resolved status. If the promise is already fulfilled, Bluebird calls __promiseFulfilled_ with the fulfilled value. Similarly if the promise is already rejected, Bluebird calls __promiseRejected_ with the rejection reason. __promiseFulfilled_ and __promiseRejected_ are similar in that they both increment the __totalResolved_ field from earlier, but they differ in that __promiseRejected_ immediately rejects the resulting promise, while __promiseFulfilled_ only resolves the promise if the number of resolved promises is greater than or equal to the length of values given to _PromiseArray_.

Something that tripped me up a little was not seeing how promises that weren't yet resolved were handled. There's a small case for *IS\_PENDING\_AND\_WAITING* promises, which just calls __proxy_ on that promise and places the promise in the values list as a temporary placeholder. __proxy_ takes the _PromiseArray_ and an _index_ as arguments sets up the _PromiseArray_ as a receiver on the pending promise. When the pending promise settles, Bluebird checks to see if it has a proxyable receiver and calls __promiseFulfilled_ or __promiseRejected_ on the receiver object. Assuming all pending promises eventually are fulfilled, the promise returned from PromiseArray will resolve when the last pending promise resolves. When any of the pending promises are rejected, the promise returned from PromiseArray will reject as well.

Hopefully that was kind of interesting. The solution implemented by Bluebird obviously isn't as "elegant" or "simple" as some of the recursive or reducer solutions we introduced earlier, but I thought it was interesting to see some of the optimizations they chose to take. The idea of proxying promise resolutions of each of the individual promises back to the returned promise seemed like a pretty simple way of handling a list of promise resolutions. I suppose you'd have to build in the idea of a receiver promise into your promise implementation, so I'd be interested if Bluebird has other uses for that functionality outside of Promise.all.
