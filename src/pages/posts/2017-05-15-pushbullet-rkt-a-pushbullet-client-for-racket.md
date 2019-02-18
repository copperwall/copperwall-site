---
layout: post
title:  "pushbullet-rkt: A Pushbullet client for Racket"
date:   2017-05-14 14:00:00
categories: racket
---

I wrote a Pushbullet client using Racket a week or so ago.

The client is made up of a majority of three parts
* API URL constants
* Low-level HTTP GET and PUSH functions
* High-level functions for each endpoint, which take either query parameters or post body data, sends the appropriate HTTP request, and returns the information in a *jsexpr* type.

The original reason to write this was because I wanted to rewrite a Python script that checked Nintendo Switch availabilities at Target in Racket. I wrote about that in [a previous post](https://www.devopps.me/blog/python/2017/05/02/using-python-to-find-nintendo-switch-availability.html). The Python script used a Pushbullet module to send a push notification to my phone whenever a Switch was found in stock within 50 miles of me. I wasn't able to find a Racket module or library to use, so I modeled this one after the the [pushbullet.py](https://github.com/randomchars/pushbullet.py) Python module I used in the original script.

To start out I added a *pushbullet* struct that accepts an Pushbullet API token. This looks like

~~~ racket
(struct pushbullet (token))
~~~

In Racket you can create a new *pushbullet* struct and access the *token* field like so:

~~~ racket
;; Create a new pushbullet struct and name it "pb"
(define pb (pushbullet YOUR_TOKEN))

;; Access the token stored within "pb"
(pushbullet-token pb)
~~~

Now that we have a way or storing and passing a *pushbullet* instance around, we can make a function that will return a list of HTTP Headers that we'll need for each API request. We'll need a `Content-Type: application/json` and `Access-Token: YOUR_TOKEN` header on each request.

To do so we can write a `default-headers` function that takes a *pushbullet* struct and return a list of headers:

~~~ racket
(define (default-headers pb)
    (list "Content-Type: application/json"
        (string-append "Access-Token: " (pushbullet-token pb))))
~~~

Using this function we can build a `get` function to take a *pushbullet* and a url string and perform the HTTP GET request with the list of default headers and returns a parsed *jsexpr* from the response body.

~~~ racket
(define (get pb url)
    (call/input-url (string->url url)
                    get-pure-port
                    read-json
                    (default-headers pb)))
~~~

We can also build a `post` function to take a *pushbullet*, a url string, a *jsexpr* body, and a optional list of extra headers, and perform an HTTP POST with those arguments.

~~~ racket
(define (post pb url data . headers)
    (read-json (post-pure-port  (string->url url)
                                (jsexpr->bytes data)
                                (default-headers pb))))
~~~

Now that we have a pretty solid framework for making authenticated GET and POST requests, building a public API for this library only takes a couple of lines per endpoint.

The most helpful endpoint for me is [create-push](https://docs.pushbullet.com/#create-push), which sends a push notification to all of your devices. This endpoint requires to POST to https://api.pushbullet.com/v2/pushes with a JSON body that includes a *title* and *body* string, and a `"type": "note"` field.

The function to do this in the client looks like:

~~~ racket
(define PUSH_URL "https://api.pushbullet.com/v2/pushes")
(define (pb-push-note pb title body)
    (define note (hash 'type "note" 'title title 'body body))
    (post pb PUSH_URL note))
~~~


Making a function for a GET endpoint is even simpler:

~~~ racket
(define ME_URL "https://api.pushbullet.com/v2/pushes")
(define (pb-get-user-info pb)
    (hash-ref (get pb DEVICES_URL) 'devices))
~~~

The library doesn't support all of the Pushbullet endpoints, mostly because I don't use Pushbullet's other features enough to test it. It does currently support
* Getting user devices
* Getting user chats
* Getting user info
* Getting channels
* Getting all push notifications
* Sending push notifications to all devices

### Areas of Improvement

This currently doesn't include an `info.rkt` file to use this with something like `raco pkg`. This is a pretty high priority fix, since this library is kind of useful if you can't include it in a Racket file with something like `(require pushbullet)`. Other than that it'd be nice to have more complete support for the Pushbullet API, but I'll add those incrementally over the next couple weeks.

If you'd like to use this and really want a certain endpoint supported, feel free to make an issue at [https://github.com/copperwall/pushbullet-rkt](https://github.com/copperwall/pushbullet-rkt).

### Full Source

This project is hosted on Github at [copperwall/pushbullet-rkt](https://github.com/copperwall/pushbullet-rkt), but here's a copy of the source as of this writing.

~~~ racket
#lang racket

(require json)
(require net/url)

;; pushbullet-rkt
;; A minimal racket library for interacting with Pushbullet.

;; URL definitions
(define DEVICES_URL "https://api.pushbullet.com/v2/devices")
(define CHATS_URL "https://api.pushbullet.com/v2/chats")
(define CHANNELS_URL "https://api.pushbullet.com/v2/channels")
(define ME_URL "https://api.pushbullet.com/v2/users/me")
(define PUSH_URL "https://api.pushbullet.com/v2/pushes")
(define UPLOAD_REQUEST_URL "https://api.pushbullet.com/v2/upload-request")
(define EPHERMERALS_URL "https://api.pushbullet.com/v2/ephemerals")

(struct pushbullet (token))

;; Make an authenticated GET request to the given url string.
(define (get pb url)
  (call/input-url (string->url url)
                  get-pure-port
                  read-json
                  (default-headers pb)))

;; Make an authenticated POST request to the given url string
;; using the data jsexpr as the request body.
(define (post pb url data . headers)
  (read-json (post-pure-port (string->url PUSH_URL)
                                (jsexpr->bytes data)
                                (default-headers pb))))

;; Create a list of default headers given a pushbullet struct.
;; This uses the token field of the pushbullet struct for
;; authentication.
(define (default-headers pb)
  (list "Content-Type: application/json"
        (string-append "Access-Token: " (pushbullet-token pb))))

;; Get a list of devices
(define (pb-get-devices pb)
  (hash-ref (get pb DEVICES_URL) 'devices))

;; Get a list of chats
(define (pb-get-chats pb)
  (hash-ref (get pb CHATS_URL) 'chats))

;; Get a hash of user information
(define (pb-get-user-info pb)
  (get pb ME_URL))

;; Get a list of channels
(define (pb-get-channels pb)
  (hash-ref (get pb CHANNELS_URL) 'channels))

;; Get a list of all pushes
(define (pb-get-pushes pb)
  (hash-ref (get pb PUSH_URL) 'pushes))

;; Send a push to all devices with the given title and body
(define (pb-push-note pb title body)
  (define note (hash 'type "note" 'title title 'body body))
  (post pb PUSH_URL note))
~~~
