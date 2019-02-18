---
layout: post
title:  "Practical Racket: Using a JSON REST API"
date:   2017-04-30 15:00:00
categories: racket
---

### Why Racket?

I've mostly been discouraged from writing smaller, one-off programs in Scheme/Racket because I've only used it in an academic context. This includes writing a small interpreter in a programming languages class in college (which was super cool) and learning functional programming patterns from a book like [The Structure and Interpretation of Computer Programs](https://mitpress.mit.edu/sicp/full-text/book/book.html) (SICP). I've been able to apply some of the functional patterns I've learned to other languages like PHP or JavaScript, but I'd also like to be able to use Racket as a tool when writing more general programs. The purpose of this series is to document some practical uses of Racket, and explain any rough edges that I run into and some ways to soften those out. Some of these uses include getting and posting to a REST API, reading and writing to files, parsing formats like JSON, XML, or CSV, and using a database.

This first post explains how to do simple HTTP GETs to a JSON REST API, and then parse the JSON response into a form that you can traverse and manipulate in Racket.

### Simple HTTP GETs

I started this off by looking for a super simple function that takes a URL and returns the body of the
response as a string. Something like Python's [`urllib.urlopen`](https://docs.python.org/3/howto/urllib2.html). The closest thing I found was the [`call/input-url`](https://docs.racket-lang.org/net/url.html#%28def._%28%28lib._net%2Furl..rkt%29._call%2Finput-url%29%29) function from the `net/url` package.

It works like so

~~~ racket
(require net/url)

(call/input-url (string->url "https://www.ifixit.com/api/2.0/guides/13470")
                get-pure-port
                port->string)
~~~

That snippet will return a string of the JSON representation of [The Orange Teardown](https://www.ifixit.com/Guide/asdf/13470) on iFixit.com.

#### Details

It's cool that it works, but `string->url`, `get-pure-port`, and `port->string` could use some more explanation.

`string->url` takes a string, and returns a [**url**](https://docs.racket-lang.org/net/url.html#%28def._%28%28lib._net%2Furl-structs..rkt%29._url%29%29) struct that contains fields for each segment of the url
* scheme
* user
* host
* port
* path-absolute?
* path
* query
* fragment

Giving `string->url` a full URL like the one above will return a populated **url** struct, while `(string->url "index.html")` will return a **url** struct with only the **path** field populated with "index.html".

`get-pure-port` is a little misleading if you're not familiar with Racket. My initial thought was that it meant a TCP/UDP port, but in Racket, a [port](https://docs.racket-lang.org/reference/ports.html#%28tech._input._port%29) is something that produces or consumes bytes. This is essentially a stream or buffer used with which to fill the response. As far as the difference between an **pure port** and an **impure port**, here's a quote from the Racket docs.

> A pure port is one from which the MIME headers have been removed, so that what remains is purely the first content fragment. An impure port is one that still has its MIME headers.

By passing the procedure `get-pure-port` to `call/input-url`, we're specifying that we do not need the MIME headers.

`port->string` is a procedure that converts a **port** to a **string**. Realistically you could pass a procedure that takes a port and returns anything, and that would be the output of `call/input-url`.

Here's an example of passing a procedure that takes a **port** and returns a **jsexpr**, Racket's representation of a JSON document.

~~~ racket
(require json)
(require net/url)

(call/input-url (string->url "https://www.ifixit.com/api/2.0/guides/13470")
                get-pure-port
                (lambda (port)
                  (string->jsexpr (port->string port))))
~~~

Now the output of this function is a **jsexpr**, instead of a **string**.

Just to make this a little cleaner, we can make use of `compose`, which takes a variadic list of procedures, and composes them together. `(compose string->jsexpr port->string)` returns a procedure that looks like

~~~ racket
(lambda (x)
   (string->jsexpr (port->string x))))
~~~

so you're basically creating a new abstraction that calls the last procedure in the list of arguments, then passes that result to the second to last procedure in the list of arguments, until you get to the first procedure in the list, which returns it's result. The idea isn't too different from piping things together in a shell command. If we were planning on using this procedure a lot we could even give it a name like `(define port->jsexpr (compose string->jsexpr port->string))`, but we're using it once, so whatever.

To add a little more abstraction, we make a simpler function that just takes a **string** url and returns a **jsexpr**.

~~~ racket
(require net/url)
(require json)

(define (get-json url)
   (call/input-url (string->url url)
                   get-pure-port
                   (compose string->jsexpr port->string)))

;; Returns a parsed JSON expression
(get-json "https://www.ifixit.com/api/2.0/guides/13470")
~~~

Hooray! Now we have the tools to download and parse a JSON document from whichever service you wish. We just need to know how to select things from the JSON document.

### JSON

Now that we have the JSON in a form we can deal with, we need to know how to operate on it. The [Racket JSON docs](https://docs.racket-lang.org/json/#%28def._%28%28lib._json%2Fmain..rkt%29._jsexpr~3f%29%29) give a pretty good explanation of which Racket types are used to represent corresponding types in JSON. Lists are lists, booleans are booleans, strings are strings, numbers are numbers, and objects are hashes. There are a lot of things you can do with hashes in Racket, so I'd recommend checking out that [doc page](https://docs.racket-lang.org/reference/hashtables.html). For a quick example, you can get the value at a key by using `(hash-ref hash 'keyname)`.

If we wanted to get the username of the author of the guide, we could do

~~~ racket
(define guide-data (get-json "https://www.ifixit.com/api/2.0/guides/13470"))

(hash-ref (hash-ref guide-data 'author) 'username)
~~~

This grabs the value of the key **author** and then grabs the value of **username** from that.

For a little more complex example we can grab the names of all tools used in the [iPhone 7 Teardown](https://www.ifixit.com/Teardown/iPhone+7+Teardown/67382).

~~~ racket
#lang racket

(define IPHONE_7_TEARDOWN "https://www.ifixit.com/api/2.0/guides/67382")

(require net/url)
(require json)

(define (get-json url)
   (call/input-url (string->url url)
                   get-pure-port
                   (compose string->jsexpr port->string)))


(define guide-data (get-json API_URL))

(map (lambda (tool)
            (hash-ref tool 'text))
   (hash-ref guide-data 'tools))
~~~

The result of this should be

~~~
'("64 Bit Driver Kit" "Spudger"
  "Tweezers"
  "iFixit Opening Picks set of 6"
  "iSclack")
~~~

With the procedures described in this post you should be able query API endpoints in general and extract information from them. In order to do a POST request, or add Headers, it'll take a different procedure, which I'll cover in another post as soon as I figure out how to use it.

### Extra Notes

I realized that you can actually use a procedure called `read-json` instead of `(compose string->jsexpr post->string)` as the handler argument for `call/input-url`. `read-json` takes a **port** as input and returns a **jsexpr** as output, which handles the functionality that our `(compose string->jsexpr port->string)` procedure was made for.
