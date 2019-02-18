---
layout: post
title:  Using acme-client for LetsEncrypt on FreeBSD
date:   2017-01-24 22:00:00
categories: writing how-to freebsd
---

I've been using the reference python implementation for LetsEncrypt since the beta days. I don't think that there's anything inherently wrong with it, but I recently heard about an alternative implementation called [acme-client](https://kristaps.bsd.lv/acme-client/) on an episode of [BSDNow](http://www.jupiterbroadcasting.com/101327/fuzzy-auditing-bsd-now-151/). One of the great things about LetsEncrypt is that it uses an open specification called ACME. Because the specification is open, there are alternative implementations to use besides the reference one provided by LetsEncrypt. When I was using the reference client (now known as [certbot](https://certbot.eff.org/)), usage on FreeBSD was not competely supported. It also required a lot of dependencies and needed a lot of RAM to run. I understand that cloud computing resources are pretty cheap, but I thought it might be worthwhile to at least try a more lightweight C implementation. Plus it was [imported into OpenBSD](http://undeadly.org/cgi?action=article&sid=20160901060733) recently, and they seem to know a thing about security. Setting it up the first time was arguably more difficult than certbot, but hopefully you can benefit from some of the things I've learned so far. Just to reiterate, this guide is for setting up *acme-client* to work with a multi-domain nginx setup on a FreeBSD machine.

## Background

*acme-client* is written to make use of OpenBSD security features like *pledge*. The main idea behind pledge is that programs can be written in multiple parts and each part can be given only as many OS privileges as needed by that one portion of the program. This is useful in the case of a program that needs write access to files owned by *root*, but only for a certain portion of the program. Instead of running a single process as root that reads and writes over a network interface, reads from the filesystem, and then writes to another portion of the filesystem, multiple processes can run that only have a network, read, or write privileges. That being said, the portable version of *acme-client* does not support that level of isolation in FreeBSD, because FreeBSD does not have pledge. FreeBSD does have a similar sandbox system called [capsicum](https://www.freebsd.org/cgi/man.cgi?query=capsicum&sektion=4), but the portable version does not support capsicum. That being said, the portable version of *acme-client* is still written so that each segment of the ACME procedure is segmented into its own process. One other benefit is that *acme-client* uses LibreSSL for TLS needs instead of OpenSSL.

## Installation

I couldn't find *acme-client* in the list of binary packages supplied by *pkg*, so I had to build it from the ports tree at `/usr/ports/security/acme-client`. I built it with `make package` and added the resulting *txz* file to *pkg* by using `pkg add <filename>`. If you are planning on running this in a jail, you can move the package file into your jail's subdirectory and add it to *pkg* from within the jail. I run nginx from within a jail, so I did that.

*Edit: (04-08-2017)* There is now an *acme-client* binary package, so you can install it with `pkg install acme-client`.

## Configuration

### Challenge Directory Setup

By default, *acme-client* places challenge files in `/usr/local/www/acme`. You can override this with the `-C` flag, but I found it was easier to map that directory into the default nginx location for `.well-known/acme-challenge`.

To make this happen I added a new configuration file in `/usr/local/etc/nginx` called `acme.conf` with the following text.

~~~ conf
# acme.conf
location ^~ /.well-known/acme-challenge {
   alias /usr/local/www/acme;
   try_files $uri =404;
}
~~~

I then added the following line in the server block in `/usr/local/etc/nginx/nginx.conf`

~~~ conf
include acme.conf;
~~~

By doing this, all domains that are served by nginx will correctly serve challenge files placed by *acme-client*. No further configuration with *acme-client* is necessary for this portion of the validation process.

### The *acme-client* Command

In order to get certificates for your domains, you'll need to be aware of which flags to use when using the `acme-client` command. I run the command in the following format:

~~~ sh
acme-client \
-v  \    # Verbose logging to know what the client is doing.
-e  \    # Allows expanding the domains listed in the certificate. This is necessary if you want to add a subdomain.
-m  \    # The bread and butter. Appends {domain} to all default directory paths for public, private, and account keys.
-b  \    # Backs up certs when they are modified or removed. Why not.
-n  \    # Creates a new 4096-bit RSA account key if you don't already have one.
-N  \    # Creates a new 4096-bit RSA domain key if you don't already have one.
domain \ # devopps.me
[altnames...] # www.devopps.me blog.devopps.me irc.devopps.me
~~~

Running this per domain will get you certificates for each of your domains. Pretty cool. However, LetsEncrypt certificates are only valid for a maximum of 90 days, so it's a really good idea to automate this so that you don't forget and have certificate validation errors when people try to visit your website.

### Automation (wow who saw this coming)

There are two important things to do to automate away this procedure. The first is to create a script that will run this script for each of your domains. The second is to add this script to the `/usr/local/etc/periodic/weekly` directory.

#### The Script

There is already a [sample script](https://svnweb.freebsd.org/ports/head/security/acme-client/files/acme-client.sh.sample.in?view=markup&pathrev=425172) included when you install this package added by the wonderful port maintainer. It works pretty well, but with the configuration we did with nginx and *acme-client*, we can forego some of the complexity.

Here's is the script that I use:

~~~ sh
#!/bin/sh -e

BASEDIR="/usr/local/etc/acme"
SSLDIR="/usr/local/etc/ssl/acme"
DOMAINSFILE="${BASEDIR}/domains.txt"
ACME_FLAGS="-v -e -m -b -n -N"

cat "${DOMAINSFILE}" | while read domain line ; do
   set +e # RC=2 when time to expire > 30 days
   acme-client ${ACME_FLAGS} ${domain} ${line}
   RC=$?
   set -e
   [ $RC -ne 0 -a $RC -ne 2 ] && exit $RC
done
~~~

The script expects a text file named `domains.txt` to be placed at `{$BASEDIR}/domains.txt`. In this case `$BASEDIR` is `/usr/local/etc/acme`. The format of the file should be:

~~~
# domain altname altname...
devopps.me www.devopps.me irc.devopps.me
opperwall.net www.opperwall.net
~~~

For each line, it reads in the domain and all altnames and calls `acme-client` with those parameters and the flags we discussed earlier. If the certificates are in need of renewing, they will be renewed. Otherwise it'll be a no-op. Running this script with a populated domains.txt should renew the certificates for all of your domains.

#### The Weekly Run

It's not too bad to run this manually every couple of weeks, but it's better to let the machine do the work for you. This can be automated by adding a script to the `/usr/local/etc/periodic/weekly`. The maintainers have included another awesome sample file here called [`000.acme-client.sh`](https://svnweb.freebsd.org/ports/head/security/acme-client/files/000.acme-client.sh.in?view=markup&pathrev=425172). You don't actually need to edit anything in this file, it's good as is.

To make this file work, you need to set some variables in `/etc/rc.conf`. The lines you'll need are:

~~~ sh
# enable the weekly script
weekly_acme_client_enable="YES"
# Specify the renew script to run
weekly_acme_client_renewscript="/usr/local/etc/acme/<your_renew_script>"
# Specify the deploy script to run
weekly_acme_client_deployscript="/usr/local/etc/acme/<your_deploy_script>"
~~~

The deploy script can be used to move your certificates to other jails or other directories for other applications (mail, irc, mumble, etc.). At the very least, your deploy script should reload nginx so that the updated certificates are loaded in.

Mine looks like:

~~~ sh
#!/bin/sh

set -e

service nginx reload
~~~

## What Now?

You can add your newly acquired certificates to your nginx server block settings and serve requests over HTTPS now. Nice.
I personally moved this blog to my FreeBSD DigitalOcean Droplet after setting this up, so maybe you could do something like that. :)

## What If I Use Linux?

While the portable version of *acme-client* will work on Linux, it requires a few more dependencies. Some of the OS facilities used in this guide will need to be substituted for Linux stuff.

* You'll need to download the source from github and compile it. https://github.com/kristapsdz/acme-client-portable
* Cron can be used in place of periodic.conf to automate stuff
* Your nginx config will probably be at `/etc/nginx` instead of `/usr/local/etc/nginx`.

## What If I Use Windows?

You're on your own there.

## Problems and Stuff

If any of the steps I posted here don't work for you, let me know! Email me or tweet me or something. I'll make sure to update any errors.

## References

https://kristaps.bsd.lv/acme-client/

https://www.freshports.org/security/acme-client
