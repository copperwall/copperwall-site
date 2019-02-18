---
layout: post
title:  "Quick Jail Updating in FreeBSD"
date:   2017-02-19 00:20:00
categories: freebsd how-to
---

I've been splitting different services on my servers into their own jails so that they can be isolated for security and isolation purposes. However, these jails are long-running systems, so they need to be patched frequently. Now that I have over five of these jails running, it's been tedious to run the `pkg update` and `pkg upgrade` commands five or more times anytime I need to upgrade the software on them. I decided to make a single script that will run both of those commands on each jail.

My first attempt at this script had variable with each jail name and would iterate over that list of names, running `jexec $jail pkg update`.

~~~sh
# Version 1

JAILS="www plex db"

for JAIL in $JAILS; do
   sudo jexec $JAIL pkg update
   sudo jexec $JAIL pkg upgrade
done
~~~

This did the job, but the static list of jail names didn't really feel right. This meant that anytime I add a new jail I have to remember to update the list in this script, otherwise the jail could get left behind whenever the rest get updates. The solution I chose is to take information from the `jls` command, which outputs a list of running jails and attributes like JID, Hostname, IP Address, and Path.

~~~
# Example jls output
JID  IP Address      Hostname                      Path
 3  192.168.2.9     www.longsword.haus            /usr/local/jails/www
 4  192.168.2.8     db.longsword.haus             /usr/local/jails/db
 5  192.168.2.7     plex.longsword.haus           /usr/local/jails/plex
~~~

I only really need that first column, so I need to do something to grab that column from the output while throwing away the first row. This is a job for `awk`.

The end command for that text transformation is:

~~~sh
jls | awk 'NR>1 { print $1 }'
~~~

I'm not really an awk wizard, but from what I understand the `NR>1` means to only run the `{ }` block after the first row of text. The `print $1` means to output the first "column" from that row.

Now that we have a nice list of Jail IDs (JIDs), we can modify the update script to be more dynamic.

~~~sh
# Grab list of JIDs from running Jails
JAILS="$(jls | awk 'NR>1 { print $1 }')"

# Run pkg update/upgrade on each of those JIDs
for JAIL in $JAILS; do
   sudo jexec $JAIL pkg update
   sudo jexec $JAIL pkg upgrade
done
~~~


That's it! Running this script will run `pkg update` and `pkg upgrade` on all of your running jails.

### Improvements and Alternatives

One alternative to `jexec` is to run `pkg -j <JID>` from the host machine. This also works, but will throw warnings if your host is a different OS version from the jail. For example, my host is `12.0-CURRENT` while most jails are still some version of `11.0-RELEASE`.

An improvement to this script is to give an option to open a shell in the jail after upgrades to restart services that have been upgraded. This is helpful for when a running service has been upgraded, but needs to be restarted in order to load the new version (nginx, postgres, plex, etc.).

### Repo
[https://github.com/copperwall/pkg-all-jails](https://github.com/copperwall/pkg-all-jails)
