---
layout: post
title: Introduction to ES2015 Proxy
date:   2019-8-19 09:00:00
description: Just some thoughts on Proxy
tags: javascript es2015 programming
banner: https://s3-us-west-2.amazonaws.com/copperwall-blog-images/copperwall-dev/mdn-proxy.png
---

I was playing around with some `Object.defineProperty` stuff at work today and I thought I'd give Proxys another look since I was knee deep in setting getters and setters and enumerable and writeable fields. It put me in the mood for some JavaScript stuff.

The Proxy object in ES2015 lets you create a new object by combining a target object (the original object) and a handler spec. A handler spec is an object with methods that are called when certain actions are taken on the returned object from `new Proxy(target, handler)`. When I say object I don't just mean something like `{ key: value }`, functions are also objects, as well as things like `new String("hello")`. [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#Methods_of_the_handler_object), as always, has a wonderful reference of all of the possible handler methods you can add. Some pretty cool ones that stand out to are [handler.apply()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/apply), [handler.construct()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/construct), [handler.set()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set), and [handler.get()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get).

One silly example to start off with is creating a loud object that `console.log`s any time a value is set or accessed from it. Our handler spec includes `get` and `set` methods, which are called whenever those particular actions happen to our object. This example prints out what happens to the object and outputs the stack trace to see where exactly the operation happened. This is kind of a fun trick if you want some more information about how an object is being used in your code.

It's important to note that the `target` argument passed to your Proxy handlers is the original object passed to the Proxy constructor. *It's not a copy, it's the same reference.* Any mutations or alterations you do on that object will affect the original object, which may introduce bugs if you're not careful.

```js
const myObject = {};
const loudObject = new Proxy({}, {
  get(target, p) {
    console.log(`Accessing key ${String(p)} at ${(new Error()).stack}`);
    return target[p];
  },

  set(target, p, value) {
    console.log(`Setting key ${String(p)} to ${String(value)} at ${(new Error()).stack}`);
    target[p] = value;
    return true;
  }
});

// "Accessing key hello at Error
//    at Object.get (/Users/user/projects/proxy/index.js:21:62)
//    ..."
loudObject.hello;
// "Setting key hello to woop at Error
//    at Object.get (/Users/user/projects/proxy/index.js:21:62)
//    ..."
loudObject.hello = 'woop';

myObject.hello // 'woop'
```

One interesting application for proxies is creating mock or spy functions for testing. If you've ever used Jest, Sinon, or another test framework that adds support for spies and mocks (Mockito is another one outside of JavaScript land), you've probably created a mock function in order to assert what that function was called with when used in your application code.

The example below shows how to make a `test.spy` method that takes a function and returns a proxied function which keeps track of the list of arguments and return value for each function call to the proxied function. It's important to note that the return value of `test.spy` acts the same as the original function passed in, but it has a special handler that runs when the function is called that records metadata about that call. You can use Proxy to instrument your functions without the need for your calling code to be aware of that.

```js
const test = {
  spy: function(fn) {
    const calls = [];
    return new Proxy(stuff, {
      apply(target, thisArg, args) {
        const result = target.apply(thisArg, args);
        calls.push([args, result]);
      },

      get(target, p){
        if (p === 'calls') {
          return calls;
        }

        return target[p];
      }
    });
  }
};

function stuff(arg1, arg2) {
  return `${arg1} ${arg2} cool`;
}

function doSomeStuff(fn) {
  return stuff(1, 2);
}

const spyStuff = test.spy(stuff);

spyStuff("hello", "cool");

doSomeStuff(spyStuff);

const calls = spyStuff.calls;
assert(calls[0][0][0] === "hello");
assert(calls[1][1] === "hello cool cool");
```

Proxy can be a pretty powerful abstraction, but I haven't seen it used in code too much, so I don't have a good idea it's useful and when it might actually be overcomplicating your program. Adding it for debugging and testing use cases sounds pretty novel, but I don't know what the performance cost is for using that abstraction, so I'm not sure if it's the best to use in production code.

If you've come across any cool use cases for Proxy I'd be really interested in hearing about them! I'm going to try to make a tool that uses Proxy to persist a JS object in S3 through a Proxy with get and set handlers, which will probably make it's way into my next post.
