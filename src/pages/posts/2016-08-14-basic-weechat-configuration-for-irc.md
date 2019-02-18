---
layout: post
title:  "Using Weechat for IRC"
date:   2016-08-14 2:11:00
categories: irc, how-to
---

[IRC](https://en.wikipedia.org/wiki/Internet_Relay_Chat) is pretty cool, you can find chat rooms for almost any topic [rizon](irc.rizon.net) or ask questions and talk about technology and open source projects on [freenode](irc.freenode.net). The [Cal Poly Linux User's Group](http://cplug.org) has a semi-active channel at #cplug on freenode where you can discuss Linux, open source, or anything about computers with local people.

Weechat is an IRC client that runs in a terminal with a curses interface. There are other clients that are web based ([kiwiirc](http://kiwiiirc.com)) and graphical applications ([hexchat](https://hexchat.github.io)), but if you are looking to use a terminal-based client, I've found the Weechat is the most user-friendly from the start.

## Installation

### OSX/MacOS

You'll need homebrew to easily install it.

~~~
   brew install weechat
~~~

### Linux

A fairly recent build of Weechat should be in your Linux distro's package repositories.

## Configuration

Weechat does not need much configuration to get running, but at the least you will need to add the server you wish to connect to.

In this example we'll add the rizon IRC server. In order to do this open weechat and type

~~~
/server add rizon irc.rizon.net 6667
~~~

if you'd like to connect with SSL do

~~~ sh
# NOTE: You may need to add an ssl certificate bundle in order for this to work
/server add rizon irc.rizon.net 6697 -ssl
~~~

Next, you'll want to specify which nick (username) you want to use on this server. You can do this with the **/set** command. If you specify multiple nicks, the first one available will be used.

~~~
/set irc.server.rizon.nicks "nick1, nick2, nick3"
~~~

If you'd like to configure any other server properties, you can modify them with

~~~
/set irc.server.<server name>.<property> <value>
~~~

You can now connect to the server using

~~~
/connect <server name>
~~~

The next step is to join a channel.

~~~
/join #/g/sicp
~~~

You should now be in a channel, and should see a list of users currently in that channel in a list on the right side of the terminal. To join another channel, use that same command from above. When you are in multiple channels you can naviate between different channels you have joined by using the **alt + left arrow/right arrow** key combos. **alt + [0-10]** will take you to the first ten channels you've joined. You can also quickly move to channels that have had activity in them by using **alt + a**.

For extra usability I recommend running

~~~
/mouse enable
~~~

which lets you use your mouse to scroll and interact with Weechat.

## Persistence

If you would like to always be available in a channel in order to maintain a chat history or be available for mentions, consider running weechat in a screen or tmux session on a server.

By doing this you can access your IRC client by ssh'ing into your server and attaching the screen or tmux session that Weechat is running on. Once you're done chatting, you can detach the session and go on your way without logging out of your channels.
