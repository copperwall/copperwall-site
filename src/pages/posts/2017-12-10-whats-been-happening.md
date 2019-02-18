---
layout: post
title:  "What's been happening"
date:   2017-12-10 23:00:00
categories: general
---

I haven't posted in like half a year, and that's kind of sad, but shit's busy yo.

## Summer

Over the summer me and a coworker helped add the first WYSIWYG text editor to ifixit.com. We used a tool called ProseMirror for the actual front end editor and used software that I wrote for my senior project to transform the JSON output from the editor into wikitext that is compatible with the legacy system that iFixit uses to represent rich text for guides, wikis, and forum posts. All comments on iFixit guides and wikis now use the new WYSIWYG editor. You can check it out for yourself on the [iPhone X Teardown](https://www.ifixit.com/Teardown/iPhone+X+Teardown/98975).

The final product may not be super impressive right now, but it was pretty groundbreaking as far as front end projects at iFixit go.

Here's some of the ground we broke:
* One of the first projects to be managed by NPM instead of git submodules.
* One of the first projects to make use of our new Webpack build system
* One of the first projects that we wrote exclusively in ES2015.

We also uncovered and fixed some bugs in our comments framework and rewrote parts of the JSON to wikitext transformer to produce simpler wikitext for the back end to parse.

This deserves its own post, but I'll probably put that up under [medium.com/ifixit-engineering](https://medium.com/ifixit-engineering).

## September

I went to PAX West, which was super fun. It was the second time I've gone, so I knew a little more about which things I wanted to get done in the four days that we were there. It was also really great to see a bunch of band/engineering friends from college. It's kind of easy to forget to visit the Bay Area to see everyone's who's moved up there. I should really try and make a better effort to do that.

## October

I wrote a cool medium post about debugging JS in both a browser and server environment using Chrome/Node DevTools. [https://medium.com/chris-opperwall/using-chrome-devtools-to-debug-frontend-and-backend-javascript-ae4815065cb4](https://medium.com/chris-opperwall/using-chrome-devtools-to-debug-frontend-and-backend-javascript-ae4815065cb4)

Knowing more about debugging tools has really made front end development bearable/maybe even fun at work and for other projects. I really recommend trying to use the debugging tools if you don't already.

I also did a bunch of refactoring on Pulldasher to remove some legacy tooling. We got rid of Bower and moved to using NPM for browser and node modules. Instead of using RequireJS to fetch front end modules, we're using Webpack to bundle, transpile, and minify the browser JS. The best part about using Webpack is that we can easily include loaders for things like TypeScript and Babel, which means we can start using newer features from ES2015 and beyond, or start using TypeScript to have better type enforcement/definitions.

## November

I helped finish up a project to change the way we store carts on iFixit. We went from storing cart data as a serialized object to storing its contents in a collection of relational tables. Looking back we were probably a little crazy to take that on so eagerly, but it was really nice to refactor that part of the site. Now that cart data is normalized it's much easier to query data for analytics or auxiliary purposes.

## December

We're looking to try out a NoSQL solution at work for data that's more analytical than related to the main application. We're probably going to go with MongoDB, but that's something to look into a little more. More info about that will probably end up in a writeup at [medium.com/ifixit-engineering](https://medium.com/ifixit-engineering).

Other than that I'll probably be in the Bay Area after Dec 22nd and through the new year, so if we haven't hung out in a while and you're in the area hit me up :D
