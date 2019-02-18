---
layout: post
title: Using Jails with ZFS and PF on DigitalOcean
date: 2016-11-13
categories: writing how-to
---

## Background

Jails are a way to create an isolated environment to run programs in on FreeBSD. The idea is that given a directory subtree, hostname, ip address, and start command, you can have an isolated environment to run programs. Programs running within a jail cannot see information about other processes outside of the jail, and cannot open files outside of the directory subtree the jail was started on. I'm currently running nginx on a droplet within a jail. This jail is currently just acting as a web server, but can eventually act as a reverse proxy for other jails.

## Filesystem Setup with ZFS

To setup a jail we need a directory to place the base system. I chose to place my jail directories in `/usr/local/jails`, but you can place them other places like `/usr/jails/` or `/jails`. To start off I created a new ZFS dataset called `zroot/jails`.

To create this dataset run:

~~~ sh
zfs create -o mountpoint=/usr/local/jails zroot/jails
~~~

We can then create a new dataset named basejail in `zroot/jails`.

~~~ sh
zfs create zroot/jails/basejail
~~~

Now that there's a directory setup for the base jail template, we need to get grab a [tarred archive](http://ftp.freebsd.org/pub/FreeBSD/snapshots/amd64/11.0-STABLE/base.txz) of the base system. Once that's extracted we can create a snapshot of the basejail dataset and give it the name of the base system version. My basejail is currently at FreeBSD 11.0-p3, so my base snapshot is called `11.0-p3`.

~~~ sh
# Extract base sytem to basejail directory
tar base.txz -C /usr/local/jails/basejail

# Copy resolv.conf
cp /etc/resolv.conf /usr/local/jails/basejail/etc

# Run freebsd update on the basejail system.
freebsd-update -b /usr/local/jails/basejail

# Create a zfs snapshot.
zfs snapshot zroot/jails/basejail@11.0-p3
~~~

You can now clone the snapshot for each new jail you create. If you wanted to create a jail called `www`, create a new zfs dataset called `zroot/jails/www` which is cloned from the `zroot/jails/basejail@11.0-p3` snapshot.

~~~ sh
zfs clone zroot/jails/basejail@11.0-p3 zroot/jails/www
~~~

The clone is instant and doesn't take up additional space. Only new changes to the `zroot/jails/www` will cause extra disc space to be used.

## Firewall and NAT with PF

Jails need an IP address in order to communicate with other machines, but DigitalOcean instances are only given one public IP address, so to get around this we can use PF (Packet Filter) to operate as a NAT and place our jails behind the NAT.

First off we need a new loopback network interface to communicate over, so we should add the following string to `/etc/rc.conf`:

~~~ conf
# /etc/rc.conf

cloned_interfaces="lo1"
ifconfig_lo1="inet 172.16.1.1 netmask 255.255.255.0"
~~~

This creates a new network interface named `lo1` which is given an IP address of `172.16.1.1`. You can give it a different IP address, but make sure that it's one of the [RFC 3928](https://tools.ietf.org/html/rfc3927) link-local IP addresses.

These network settings will have to be loaded after you edit `/etc/rc.conf`, so you can either restart you machine or run

~~~ sh
/etc/rc.d/netif restart && /etc/rc.d/routing restart
~~~

We have an interface and an IP address, but we need firewall rules now to make sure the correct ports are forwarded and that traffic from the jail is allowed through the default interface on the host.

To do this we add `pf_enable="YES"` to `/etc/rc.conf`

~~~ conf
# /etc/rc.conf

pf_enable="YES"
~~~

After that create `/etc/pf.conf` and add the following information:

~~~ conf
# /etc/pf.conf

ext_if = "vtnet0"
ext_addr = "<your public ip address>"
int_if = "lo1"
jail_net = $int_if:network

nat on $ext_if from $jail_net to any -> $ext_addr port 1024:65535 static-port
~~~

Once that's done run `service pf start` and `pfctl -f /etc/pf.conf` as root to start `pf` and to load the new firewall rules.

## Jail Configuration

Jail configuration can be done with `sysrc` or with `/etc/jail.conf`. For my purposes I used `/etc/jail.conf`. My `/etc/jail.conf` looks like:

~~~ conf
# /etc/jail.conf

# Global Stuff

exec.start ="/bin/sh /etc/rc";
exec.stop = "/bin/sh /etc/rc.shutdown";
exec.clean;
mount.devfs;

path = "/usr/local/jails/$name";

# Jail definition for www.
www {
   host.hostname = "www.opperwall.net";
   ip4.addr = 172.16.1.1;
}

~~~

So far I haven't had to specify anything specific for each individual jail other than `host.hostname` and `ip4.addr`.

To finally start the jail run

~~~ sh
jail -c www
~~~

Hooray!

You can open a shell within the jail using

~~~ sh
jexec www tcsh
~~~

By default you cannot use ping or traceroute in a jail because jails do not have permission to use raw sockets. You can test internet connection using something like `telnet`.

## Extras

Since we made a jail called `www`, it would be nice if requests to port 80 and 443 on the host machine would get forwarded to the `www` jail's IP address. This port forwarding can be added with two more lines to the `/etc/pf.conf` file.

Add the lines

~~~ conf
www_addr = "172.16.1.1"
www_web_ports = "{ 80, 443 }"

rdr pass on $ext_if inet proto tcp to port $www_web_ports -> $www_addr
~~~

Run `pfctl -f /etc/pf.conf` to load the new rules.

## References

[http://kbeezie.com/freebsd-jail-single-ip/](http://kbeezie.com/freebsd-jail-single-ip/)

[https://www.kirkg.us/posts/how-to-configure-a-freebsd-jail-on-a-digital-ocean-droplet/](https://www.kirkg.us/posts/how-to-configure-a-freebsd-jail-on-a-digital-ocean-droplet/)
