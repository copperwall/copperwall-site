---
layout: post
title: "Shitty Weekend Project: Spongebob Mock Text"
date:   2019-11-24 15:00:00
description: Just some stuff about document.createTreeWalker
tags: javascript programming
---
Every once in a while it's nice to build something that's dumb or not useful or downright questionable.

This weekend I had an urge to make something that takes some text and returns the text from that one SpongeBob meme where he repeats something said to him back in a mocking way.

You know, this one.

<div style="text-align: center">

![spongebob mocking](https://copperwall-blog-images.s3.us-west-2.amazonaws.com/copperwall-dev/Mocking-Spongebob.jpg)

</div>

I started off with a new [CodeSandbox](https://codesandbox.io) (which is a great way to mess around or experiment with ideas without having to create and initialize a new project in VSCode or whatever editor you use. It's especially helpful if you're trying out something with React and you don't want to go through the motions of `create-react-app`.

The first attempt was two functions, `mock` and `toggleCase`. `toggleCase` accepts a single-length string, checks if it's alphabetical (using regex), and toggles the case if depending on if it's already uppercase or not. This could have a little more error handling like checking if the value is a string type, but it generally follows the principle that if you give it invalid input, it'll give you that input right back. I think that's the "garbage in garbage out" principle, but I'm not sure that's the best name for this use case, because some inputs like whitespace and numbers can't be toggled, so they should be returned as is. I'm not sure if that's technically "garbage". If you give the function a string that isn't one character, it returns that string as is, and if you pass a non-alphabetical character it returns it back untouched.


```js
function toggleCase(str) {
  if (str.length !== 1) return str;

  if (str.match(/^[A-z]$/)) {
    if (str.toUpperCase() === str) {
      return str.toLowerCase();
    } else {
      return str.toUpperCase();
    }
  }

  return str;
}
```

The `mock` function takes a string value and returns a "mocked" version of that string. So if you pass "Don't use that weird spongebob meme", you'd get back "doN'T UsE ThAt wEiRd sPoNgEbOb mEmE".

It works by iterating over each character in the string and toggling the case if the character's position in the string is even. Since strings in JavaScript are immutable, instead of modifying each character in the string in place, the function splits the string on the empty string, which gives us a list of all characters in the string. With a list of characters we can use Array.prototype.map to iterate over the characters and conditionally apply the `toggleCase` function to each character based on its position. At the end of the function we join the list of characters back into a single string and return that.

```js
function mock(str) {
  return str
    .split("")
    .map((char, index) => {
      if (index % 2 === 0) return toggleCase(char);
      return char;
    })
    .join("");
}
```

With these two functions you can take a string of text and return a mocked version of it. So if you wanted to make a certain paragraph tag's contents into a mocked version of the original text you could do

```js
// mock, toggleCase definitions above

// For element <p id="contact">We're happy to hear from you</p>
let contact = document.querySelector("p#contact");
contact.innerText = mock(contact.innerText);

// Element is now <p id="contact">we'rE HaPpY To hEaR FrOm yOu</p>
```

This is cool and all, but if that `<p>` has anything like an `<a href="/contact">click here</a>` within it or any other HTML tags, you'll end up removing the html tags when you run the above code. Ideally you only want to run the mock function on [text nodes](https://developer.mozilla.org/en-US/docs/Web/API/Text). By modifying all descendent text nodes, you'll only be modifying the text of each descendent tag.

One possible way to do this correctly is by starting with the root element that you'd like to mock, and recursively all text nodes in its children and its childrens' children and so on. This is totally doable considering the root node is a root of a tree of Nodes, and that can totally be left as an exercise to the reader.

While dealing with this I also found an API called [`document.createTreeWalker`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker). This API lets you create a [TreeWalker](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker), which is effectively an iterator over Nodes in the DOM tree. That tree has a root of whichever Node you pass in as the first argument to `document.createTreeWalker`, so you could pass in `document.querySelector('p#contact')` or even `document.body`. The main method you probably want to use is `nextNode`, which advances the iterator to the next node and returns that node. The value of the node returned from `nextNode` is also readable by the `currentNode` property. The `TreeWalker` instance starts with the root node as the `currentNode` property, so it's helpful to call `nextNode` to get the first Node that matches the `NodeFilter`.

Okay, back to `document.createTreeWalker`. The arguments it takes are
* `root` - a Node such as `document.body` or `document.getQuerySelector('p.coolClass')`
* `whatToShow` - A constant to determine which type of nodes to include in the TreeWalker instance. Some include `NodeFilter.SHOW_ALL`, `NodeFilter.SHOW_ELEMENT`, and `NodeFilter.SHOW_TEXT`.
* `NodeFilter` - An object that has a method named `acceptNode`, which consumes a Node and returns a constant value to determine whether or not to include this Node in the iteration. Acceptable return values from `acceptNode` are `NodeFilter.FILTER_ACCEPT`, `NodeFilter.FILTER_REJECT`, and `NodeFilter.FILTER_SKIP`. The difference between `FILTER_REJECT` and `FILTER_SKIP` are that a rejected Node will not have its children traversed, while a skipped Node will.

So if you wanted to have a TreeWalker that returned all Text nodes in the document, you could do `document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)`. If you wanted to take that further and only receive text nodes with word characters (a-z, 0-9, _), you could do

```js
document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
        if (!node.data.match(/\d+/))
            return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
    }
});
```

There's a lot you can do with this API if you have a need to walk over the document tree and don't want to implement you're own recursive logic to do so.

To take this all the way back to the SpongeBob mock example, we can make _all text_ on a website to be the mocked version with this much code.

```js
// mock and toggleCase definitions above

function mockDocument(document, root = document.body) {
  let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    let text = walker.currentNode;
    text.replaceData(0, text.length, mock(text.data));
  }
}
```

### So what's the point?

Basically I'm trying to convey that even if you're building something that doesn't seem that important, you can find some useful piece of knowledge that you can add to your toolbelt as a developer.

Also I published this to npm under [`mock-text-node`](https://www.npmjs.com/package/mock-text-node) if you want to use it in your own projects.

### Bonus

I tried this out on the Gatsby docs I think this worked out pretty well.

![gatsby_mocked.png](https://copperwall-blog-images.s3.us-west-2.amazonaws.com/copperwall-dev/gatsby-mocked.png)

### Additional Resources

While reading about `TreeWalker`, I also learned about an alternative traversal method called [`NodeIterator`](https://developer.mozilla.org/en-US/docs/Web/API/NodeIterator). A `NodeIterator` can be created by calling `document.createNodeIterator`, which has almost the same interface as `document.createTreeWalker`, but without an optional fourth argument, `entityReferenceExpansion`. The methods on a `NodeIterator` instance only include `nextNode` and `prevNode`, while `TreeWalker` include additional methods to access the current Node's parent, children, and siblings.

I wasn't able to find any documentation on MDN explaining the main different between the two of them, but in the [W3C spec](https://www.w3.org/TR/DOM-Level-2-Traversal-Range/traversal.html#Traversal-overview-h2) on Document Object Model Traversal explains in its Overview section.

> NodeIterators and TreeWalkers are two different ways of representing the nodes of a document subtree and a position within the nodes they present. A NodeIterator presents a flattened view of the subtree as an ordered sequence of nodes, presented in document order. Because this view is presented without respect to hierarchy, iterators have methods to move forward and backward, but not to move up and down. Conversely, a TreeWalker maintains the hierarchical relationships of the subtree, allowing navigation of this hierarchy. In general, TreeWalkers are better for tasks in which the structure of the document around selected nodes will be manipulated, while NodeIterators are better for tasks that focus on the content of each selected node.

So for our example we could actually use a `NodeIterator` instead, considering we don't need to access the hierarchical structure of the document as we iterate through text nodes. We only need access to the next node in the traversal.

I hope you learned something helpful from this. Feel free to tweet at me at [@copperwall](https://twitter.com/copperwall) if you have any comments or questions.
