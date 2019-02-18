---
layout: post
title:  "Make your web apps into systemd services"
date:   2016-08-04 3:38:00
categories: sysadmin, web
---

Last night, I spent about an hour making systemd unit files for each service I use on my DigitalOcean droplet that I have previously either left running in tmux sessions or started manually myself. I had put this off for so long because I wasn't very familiar with how systemd worked outside of starting, stopping, and restarting services that are already configured to use systemd. However, after spending an hour or so reading documenation on the init system to help solve a server automation problem at work, I learned that you can turn processes into simple systemd services by repeating a small set of configuration options.

For a little background, I've been running around five side projects/other programs by going to their working directories, running the command to start each program, and backgrounding the process. In order to restart these programs, I had to grep `ps` output in order to find the pid, and then `kill` the process. I also had to remember (or grep through shell history to find) each command to start each process. The most complicated of these was `php -S localhost:2000 index.php &>> twiddit.log &!`. I'm sure there are worse commands to remember that include many more arguments and multiple environment variable assignments, but it was still pretty annoying.

Now that each program is started as a systemd service, I can start, stop, and restart each program through the `systemctl` command from anywhere on my machine, I can specify that they start on boot, and I can view each processes' logs through `journalctl`.

## Example Time (yay)

I'm going to go over the systemd unit file I wrote to make this Jekyll blog into a systemd service.

Here's the whole thing.

~~~ conf

# jekyll.service
[Unit]
Description=Jekyll
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/jekyll/blog
ExecStart=/usr/local/bin/jekyll serve
User=jekyll
Group=jekyll
Restart=always

[Install]
WantedBy=multi-user.target

~~~

There are three sections to this file, so we'll go over them one by one.

### [Unit]

The Unit section contains generic information about the systemd unit, which is not specific to whether it is a systemd service, or mountpoint, or target, etc. For reference we are making a service.

This Unit section on has a two options, **Description** and **After**. **Description** is used to describe the unit. **After** is used to specify any other units that we want this unit to start after. Since Jekyll is a blog, it would be helpful if the network on the system is initialized before Jekyll starts up.

### [Service]

The Service section contains options that are specific to a service. The **Type=simple** means that this process does not fork after running the command in **ExecStart**, and should work in most simple cases. The **WorkingDirectory** describes where the context of this service takes place. If this is left blank, then the command in **ExecStart** will be run in the context of the `/` directory. My Jekyll directory just sits in the jekyll user's home directory so we'll use that. **ExecStart** specifies the command to run when this service is started. The path to the command has to be absolute and cannot be relative to the **WorkingDiretory**. The **User** and **Group** options specify which user and group this service will run as. It is important to specify these options if you do not want your service running as root. Finally, **Restart** can define when the service should be restarted. I've set this service to always restart in case it crashes for some reason.

### [Install]

The Install section contains information that is used when services are installed with `systemctl enable`. This means that if *enabled*, this service will be started when the `multi-user.target` group is started. This is a pretty common option.

## Let's actually use this

_Note: All systemctl commands listed here will require root privileges._

Okay, now that we have our service file all good to go, we are going to need to put it somewhere. The directory to put user-defined systemd unit files in is `/etc/systemd/system`. Place the above file in that directory under the name `jekyll.service`. Before starting the service, run `systemctl daemon-reload` to load the new unit file into systemd's configuration.

To start the Jekyll service, run `systemctl start jekyll`.

To stop the Jekyll service, run `systemctl stop jekyll`.

To restart the Jekyll service, run `systemctl restart jekyll`.

### Logging

Unless otherwise specified, output from systemd services goes to the systemd journal. To view the log output for a specific service, use `journalctl -u [service-name]`. This will open up the log in a pager for you to look through. If you would like to watch the log as it grows, run `journalctl -u [service-name] -f` and new entries in the log will appear at the bottom of the screen in a similar fashion to `tail -f`.

### Starting services at boot

One of the most helpful things about using services for my running programs is that if I restart my server I don't have to remember to start up each individual program.

To configure a service to start at boot, run `systemctl enable [service-name]`. This command symlinks the Jekyll service file in `/etc/systemd/system` into `/etc/systemd/system/multi-user.target.wants`, since we specified that the service is wanted by `multi-user.target`.

Now you can restart you server without having to remember to restart Jekyll. Cool!

## One last thing

I'm sure there are many things about systemd that I don't know about yet, so know that there are a lot of different ways to set up unit files for different types of services. Hopefully this is helpful enough to get you up and running, and to provide a good enough foundation to learn a little more if this guide doesn't quite address your needs. If I messed something up feel free to let me know.

## References

[systemd.unit](https://www.freedesktop.org/software/systemd/man/systemd.unit.html)

[systemd.service](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

[systemd.index](https://www.freedesktop.org/software/systemd/man/systemd.index.html)

[systemd.target](https://www.freedesktop.org/software/systemd/man/systemd.target.html)
