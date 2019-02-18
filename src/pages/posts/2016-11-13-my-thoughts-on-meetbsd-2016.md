---
layout: post
title: My Thoughts on MeetBSD 2016
date: 2016-11-13
categories: writing
---

## Intros

Introductions were very cool. The conference was small enough that every single person was able to introduce themselves in front of everyone. I was a little scared to introduce myself to a room of one hundred or so BSD  professionals and enthusiasts, but it was great to hear which companies people came from and why they themselves liked BSD. There was also an icebreaker section where people would stand on different parts of the room based on which side of a polarizing issue they felt more strongly about. Some of those topics included GUI vs CLI and pf vs ipfw firewalls.

## Talks

Each talk I saw answered some questions and left me with new ones. The first talk of the conference was on Jail Networking, or using netgraph or if_bridge to bridge multiple VNET jails. This talk was super helpful to me, because it showed how to have multiple jails all networked on a virtual bridge, which is super helpful if you don't have multiple public IP addresses to give a host machine. It also left me with a bunch of questions on how netgraph and if_bridge work and how to properly add virtual interfaces with ifconfig, but I made sure to write everything I didn't understand down to learn more about later. There was also a ZFS panel with four very knowledgeable people on the subject. Many of the questions asked during the panel were about aspects of ZFS that I haven't used yet, and how to use them creatively to solve problems. There were also questions about the process of porting ZFS from Solaris to FreeBSD, which were answered with some pretty cool history about ZFS's history on FreeBSD. Another great talk was the unveiling of [TrueOS](https://trueos.org), which is an evolution of **PC-BSD**, a project to help make FreeBSD more desktop-friendly. The talk included some sneak peeks at new upcoming features like OpenRC for faster boot times and bleeding edge driver support, which make it sound like a really promising laptop solution. I had tried TrueOS a month or so ago on my ThinkPad x260, but was discouraged from keeping it as a daily driver due to the lack of suspend/resume support. But hey, maybe I can help find driver problems on my laptop if they need mor e help debugging that.

## People

The people were awesome. There seemed to be a pretty good mix of experts and newcomers, and there were so many people ready to help you out with whatever questions or problems you were having. I was almost completely on the recieving end of help for the weekend, but with a little more time and experience I'd love to go back and contribute a little more help. On top of being helpful, the people I talked to were so encouraging about contributing in any way to the project. At the end of the after party on Friday night, my friend and I were considering heading home after being at the convention for over 12 hours. However, some of the FreeBSD committers left at the after party convinced us to go to a mini hackathon from 10PM to 1AM. The hackathon was taking place about two miles from the after party. Our group ended up taking a scenic route through downtown Berkeley after missing a few turns and walking in the wrong direction for a good distance. The enthusiasm was contagious.

## Breakout Discussions

Part way through the first day they started a shared Google Doc on which topics were most interesting to people. After six or so topics gained enough traction, each topic group broke off into different rooms to discuss each topic. Some of the topics included ZFS, security, iocage, promoting diversity, and running TrueOS on laptops. I went to the ZFS discussion and was able to ask a question regarding when to create multiple zpools. It probably wasn't that interesting of a question, but everyone who chimed in on an answer to the question was so helpful. It was also pretty cool to be able to ask a question to one of the original creators of ZFS.

## Where To Go From Here

Across the multiple talks and discussions I found some inspiration to work on some new projects.

### Jails with ZFS

The Jail Networking talk included a demo in which the speaker used ZFS to create a base jail snapshot, which is then cloned anytime a new jail is created. I thought that was super cool, so I spend some of the downtime over the weekend re-familiarizing myself with how ZFS snapshots and cloning worked and tried to learn how to configure jails through `jail.conf`. The result was enough to get a jail up and running with nginx on my home FreeBSD box. I haven't quite figured out how to get multiple jails working on a machine with one public IP address, but that's the next step for getting multiple jails on something like a DigitalOcean droplet. A friend expressed interest in hosting a static website, so my goal is get them a working jail with SSH port forwarded and using a reverse proxy like nginx to send traffic with their domain to their own jail.

### Install TrueOS on my desktop

I currently dual boot Ubuntu and Windows 10, but after watching the TrueOS talk I'd like to get more exposure using TrueOS on a day-to-day basis. Some of the limitations that make it a little unusable on a laptop (for me personally) don't make that much of a difference on a desktop. I can also try playing around snapshotting my desktop and backing it up to my home NAS using `zfs send/receive`.

## Pictures

![Registration Line](https://devopps.me/files/meetbsd2016/IMG_20161111_083155.jpg)

![Jail Networking](https://devopps.me/files/meetbsd2016/IMG_20161111_095211.jpg)

![History of OpenZFS](https://devopps.me/files/meetbsd2016/IMG_20161111_154355.jpg)

![TrueOS](https://devopps.me/files/meetbsd2016/IMG_20161112_130007.jpg)
