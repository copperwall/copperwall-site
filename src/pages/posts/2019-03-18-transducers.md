---
layout: post
title:  "Why Transducers Are Cool"
date:   2019-3-18 11:00:00
categories: programming javascript
---

I mostly got the inspiration for writing this post after reading the Appendix A of Functional-Light JavaScript, which explains the concepts of transducers. This is the third of fourth time I've gone through that appendix and I feel like I'm actually starting to grasp the concept, so I thought I'd write about it to grasp it a little better.

This post is going to include some functional programming concepts like function composition and currying, as well as some common list operations like map, filter, and reduce. I'll try to include a little background, but this mostly assumes you're familiar with those concepts.

## Credit

This is mostly a rehashing of Appendix A of [Functional-Light JavaScript](https://www.amazon.com/Functional-Light-JavaScript-Balanced-Pragmatic-FP/dp/1981672346/ref=sr_1_fkmrnull_1?crid=2IONLW0KNDAEN&keywords=functional+light+javascript&qid=1552939990&s=gateway&sprefix=functional+light%2Caps%2C192&sr=8-1-fkmrnull), which is a super great book on practical functional programming in JavaScript. I definitely recommend getting that book if this is interesting to you. Also if this post doesn't totally make sense, the book should be a really good resource and will probably explain these concepts better.

## Function Composition

Function composition is the idea of creating new functions by composing, combining, or chaining multiple other functions together. You can think of it like using multiple functions as building blocks or LEGOs and creating a new structure by combining those smaller pieces together. Composition is also idea used frequently in shell scripting, in which multiple commands with specific purposes are able to be easily combined to make pretty powerful programs.

In this post we'll look at _compose_, a higher order function which takes a variadic list of functions are arguments and returns a new function such that the input to that return function is passed to the last function in the argument list and that function's return value is passed as input to the second to last function in the argument and so on.

Here's a small example to illustrate.
~~~js
import { compose } from 'lodash/fp'
const addOne = x => x + 1
const isEven = x => x % 2 == 0

const isPlusOneEven = x => isEven(addOne(x))
const composed = compose(isEven, addOne)
~~~

In the above example, _isPlusOneEven_ and _composed_ are equivalent functions which both take a number, add one to it, and then return a boolean if that result is even or not. When using _compose_, the functions are executed from right to left. It's helpful to visualize the order they're shown in the _isPlusOneEven_ implementation.

## Composing mapping functions

One interesting property of composed functions is that they can be used to consolidate multiple calls to _map_ on an array.

~~~js
const resourceIds = [1,2,3,4,5];

const buildResourceURL = id => `https://api.example.com/${id}`
const fetchResource = url => fetch(url)

let responses = resourceIds.map(buildResourceUrl).map(fetchResource)

// This an intermediate list returned from the first map can be avoided by composing the two mappers
// The result should be the same as before (barring any side effects)
const getResourceFromId = compose(fetchResource, buildResourceUrl)
responses = resourceIds.map(getResourceFromId)
~~~

By composing the two mappers, _resourceIds_ can be iterated over only one time instead of two, and any intermediate lists created by separating mapping steps are avoided. So anytime there's multiple chained map calls on an array, you can condense that to a single map call with all of the mapping functions composed together.

Mapping functions can be composed because they have the same "shape". A mapper function takes a single argument and returns a single new value. The return value from a mapping function can be easily accepted as an argument for another mapping function.

## Trying to compose filter and reduce

Some other common list operations include _filter_ and _reduce_. _filter_ takes a predicate function (a function that returns true or false) and returns a new list that only includes elements that caused the predicate function to return true when that value was passed to it. _reduce_ takes a reducer function and an optional initial value. The reducer function takes a accumulator parameter and a current element parameter and is called on each member of the array that reduce is called on. _reduce_ is special in that it takes the result from the previous call to the reducer function and passes that return value as the _accumulator_ argument when calling the reducer function on the next item in the array. Some common uses for _reduce_ include taking a list of items and "reducing" them into a single result.

~~~js
// Filter example

const isGreaterThanTen = x => x > 10
const isEven = x => x % 2 == 0

[5,12,2,13,10].filter(isGreaterThanTen) // [12,13]
[5,12,2,13,10].filter(isGreaterThanTen).filter(isEven) // [12]
~~~

~~~js
// Reduce Example

// Sum doesn't need an initial value, because the first element in the array can be used as the initial value.
const sum = [1,2,3,4].reduce((accumulator, current) => accumulator + current); // 10

// The flattened reduce call uses an empty list as the initial value, because the accumulator needs to always be an array
// and the first element doesn't match that type. Calling accumulator.concat when accumulator is 0 would cause an error.
const flattened = [0, [1,2], [3,4]].reduce((accumulator, current) => accumualtor.concat(current), []) // [0,1,2,3,4]
~~~

If we can compose mapper functions, maybe we can compose adjacent filters and reduces.

~~~js
// Compose filters example

const isGreaterThanTen = x => x > 10
const isEven = x => x % 2 == 0

const isGreaterThanTenAndEven = compose(isEven, isGreaterThanTen)

// Uh oh, doesn't work :(
[5,12,2,13,10].filter(isGreaterThanTenAndEven)
~~~

In the above example, the composed function _isGreaterThanTenAndEven_ doensn't have the same shape as the two functions it's composed of. _isEven_ and _isGreaterThanTen_ both expect a number as input and return a boolean. When trying to compose them, a problem happens when the result of _isGreaterThanTen_ is passed as the input to _isEven_. At this point _isEven_ expects a number, but is given a boolean, and it loses the context of the element it's supposed to run on. There's a similar issue with _reduce_, where the reducer function returns a single value, but takes two arguments as input, so the output of one reducer function can't be simply passed to another reducer function.

The remainder of this post is about how to compose maps, filters, and reduces, such that you can take multiple maps, filters, and reduces and consolidate them into a single reduce.

## Enter Transducers

### Using reduce for map and filter

An interesting property of _reduce_ is that _map_ and _filter_ can be expressed using _reduce_.

~~~js
function reduceMap(fn) {
    return function reducer(accumulator, current) {
        accumulator.push(fn(current))
        return accumulator
    }
}

[1,2,3].reduce(reduceMap(x => x + 1)) // [2,3,4]

function reduceFilter(predicate) {
    return function reducer(accumulator, current) {
        if (predicate(current)) accumulator.push(current)
        return accumulator
    }
}

[1,2,3,4].reduce(reduceFilter(x => x > 2)) // [3,4]

[1,2,3,4]
.reduce(reduceFilter(x => x > 2))
.reduce(reduceMap(x => x + 1))
// [4,5]
~~~

Now that we can express maps and filters and multiple chained reduce calls, maybe there's something we can do to compose those reducer functions.

Something we can do in the meantime is to abstract out the functionality that combines results in _reduceMap_ and _reduceFilter_. In these examples we're always appending to a list and returning the list, we could pass the accumulated value and new value to combine and return the results.

~~~js
function reduceFilter(predicate, combiner) {
    return function reducer(accumulator, current) {
        if (predicate(current)) return combiner(accumulator, current)
        return accumulator
    }
}

function reduceMap(fn, combiner) {
    return function reducer(accumulator, current) {
        return combiner(accumulator, fn(current))
    }
}

function listCombine(list, value) {
    list.push(value)
    return list
}

function sumCombine(sum, number) {
    return sum + number
}

[1,2,3,4].reduce(reduceFilter(x => x > 2, listCombine), []) // [3,4]
[1,2,3,4].reduce(reduceMap(x => x + 1, sumCombine), 0) // 14
~~~

In the example above, we defined a _listCombine_ and a _sumCombine_. Both of these can be used as a combiner function because they accept _an accumulator and an item and return a new value_. If you look at those functions, they have the same shape as reducer functions. Maybe we can find a way to compose the combine functions with our map reducers and filter reducers! If we think of the second argument to _reduceFilter_ and _reduceMap_ and the next reducer, maybe we can chain those functions together.

~~~js
const addOne = x => x + 1
const isEven = x => x % 2 == 0
const sumCombine = (sum, number) => sum + number

const chainedReducer = reduceFilter(isEven,
                            reduceMap(addOne,
                                sumCombine))
                                
[1,2,3].reduce(chainedReducer);
~~~

We created a function called _chainedReducer_, which creates a filter reducer which checks if the value given to it is even. If the value is even, it passes the accumulator and value to the _combiner_ given to _reduceFilter_, which is this case is the addOne reducer returned by _reduceMap_. The _addOne_ reducer then passes the result of calling _addOne_ to the value and passing the accumulator and new value to its _combiner_ argument, which is _sumCombine_.

The way we're taking the output of one reduceMap function and placing it as the input of a reduceFilter is similar to how composed functions look in code.

~~~js
const chainedReducer = reduceFilter(isEven,
                            reduceMap(addOne,
                                sumCombine))
const chainedFunctions = arg => x(y(z(arg)))
~~~

The only issue is that _reduceFilter_ and _reduceMap_ take two arguments, which makes them more difficult to compose than unary functions, or functions that take a single argument. We can fix this by making _reduceFilter_ and _reduceMap_ curried functions, such that we can pass our mapper and predicate functions and then compose the partially applied functions. This is where everything starts to come together.

~~~js
import { curry, compose } from 'lodash/fp'
const transduceMap = curry(reduceMap)
const transduceFilter = curry(reduce)

const addOne = transduceMap(function addOne(x) { return x + 1 })
const isEven = transduceFilter(function isEven(x) { return x % 2 == 0 })

let transducer = combiner => isEven(addOne(combiner))
// OR
transducer = compose(
    isEven,
    addOne
)

[1,2,3,4].reduce(transducer(listCombine), []) // [3,5]
[1,2,3,4].reduce(transducer(sumCombine)) // 8
~~~

In the above example, _transducer_ is the composition of our _reduceFilters_ and _reduceMaps_ and it takes a _combiner_ as a single argument.

Something to note is that data flows through the composed reducer functions from left to right, as opposed to right to left when usually using compose. So each value will pass through _isEven_ first, and if it passes the predicate, will then be passed to _addOne_, and eventually to _listCombine_ or _sumCombine_.

### Why is it reversed?

isEven is a partially applied function that takes a combiner function as an argument. The result of calling it is a reducer function which has the predicate function and combiner function available in lexical scope. By calling the composed function with a combiner argument, the values that are being piped from right to left are reducer functions which are being passed as an argument to the next leftmost function.

So when we call _transducer(listCombine)_, _listCombine_ is passed to _addOne_ first, which is a _reduceMap_ call which has already been partially applied with a mapper function. Since _listCombine_ fulfills the last argument for the curried/partially applied function, the original _reduceMap_ function is called and returns a reducer function which accepts accumulator and current arguments, but has the mapper function and combiner functions in lexical scope. The returned reducer function is then passed into _isEven_ as _isEven_'s _combiner_ argument, which results in _isEven_ returning a reducer function that takes accumulator and current arguments, and has the predicate function and reducer from _addOne_ as its combiner in scope. The resulting value of the transducer is a reducer function that can be plugged in to any reduce function, be it _Array.prototype.reduce_, or a _reduce_ from any other functional programming library.

### Stepping through it
If you want to get a better idea of how it works, I really recommend putting some debug breakpoints in an editor like VS Code or Atom and stepping through the reducer call.

I placed breakpoints in the returned reducer functions from reduceFilter and reduceMap and stepped through to see in which order they were called and what the values of the predicate and mapper functions were, as well as the combiner functions. In the first image, the reduceFilter breakpoint is triggered first, and the predicate function value is the named _isEven_ function passed to _transduceFilter_ and the combiner function is the anonymous reducer function passed by the _addOne_ function. The first value passed to it is __1__, which doesn't pass the predicate, so the combiner function isn't called.

![debugging reduceFilter](https://s3-us-west-2.amazonaws.com/copperwall-blog-images/copperwall-dev/debug1.png)

The filter reducer is called again with __2__, which calls the combiner, which triggers the breakpoint in _reduceMap_. At this point the mapper function is the named _addOne_ function passed to _transduceMap_ and the combiner in this case is the _listCombine_ function.

![debugging reduceMap](https://s3-us-west-2.amazonaws.com/copperwall-blog-images/copperwall-dev/debug2.png)

## Libraries

If you want to try using this in your code, there's a [transducers-js](https://github.com/cognitect-labs/transducers-js) library by the people who make Clojure and ClojureScript. The docs are pretty awesome too, I really recommend taking a look at it.

## Thanks for reading!

Writing this was as much for my understanding of the concepts as it was for yours, so if anything is unclear, or if anything could be better explained, or if anything is wrong, please please let me know. I'm [@copperwall](https://twitter.com/copperwall) on Twitter.
