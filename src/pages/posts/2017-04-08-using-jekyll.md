---
layout: post
title:  "Actually using Jekyll correctly"
date:   2017-04-08 18:00:00
categories: blog
---

This is a little bit of a meta post about how this blog runs and how I'm changing it.

### Background

This blog is generated using [Jekyll](https://jekyllrb.com), a pretty popular static site generator that basically takes markdown and outputs static HTML files. This makes it pretty easy to write posts in a nice format like Markdown or CommonMark or whatever and convert it to an actual webpage. It's also nice to use because you don't need to run a database server to store blog posts in and you don't need to run an application server like PHP or Python or Ruby or whatever to query the database, build a template, and then eventually build the webpage. My blog in particular isn't very dynamic, so it just doesn't need that level or complexity.

### Old and Busted

When I originally started testing out a Jekyll install, I used this really neat feature that Jekyll provides that lets you run a development server to serve blog files using their own Ruby HTTP server. I used that method primarly and eventually forgot that you can just use `jekyll build` to generate a blog directory to place in the path of a web server like nginx or apache. What I did instead was to have nginx proxy any blog requests to the internal server that Jekyll was running. I eventually moved the blog to a FreeBSD machine and placed the server in its own jail so that it could not interact with any other processes and could only be accessed over its internal IP address. This didn't change the reverse proxy behavior for nginx, because instead of proxying the request to `localhost:4000` it just proxied to `<jail-ip>:4000` instead.

Something else about the old setup was that uploading new files was not a very simple procedure. Whenever I wrote a new post, I had to rsync the markdown file to the FreeBSD host, then copy it into the Jekyll jail's chroot'ed subdirectory, then enter the jail and run jekyll build to refresh the generated static files.

### New Hotness

Like I mentioned earlier, Jekyll is primarily for generating static HTML files from Markdown files, not serving them. The new method of serving the blog involves taking the source Markdown files and outputting the generated files in the `blog` directory of the webroot for `devopps.me`. Instead of proxying the request off to a Ruby server and proxying it back in the response, nginx can just serve the static file, which it's really good at.

Since I was taking some time to revamp how the blog is served, I thought I'd take the time to revamp how the blog is updated. Instead of some rsync/cp/jexec command, I thought it'd be cool to keep the blog in a git repo and add a `post-receive` event to regenerate the static files. The way this works is that I host a remote repo for the blog on my server and push updates to it when I finish new posts. When the remote repo is updated, it triggers the `post-receive` hook, which is specified in `hooks/post-receive` in the remote repo directory.

There's a [super helpful guide](https://jekyllrb.com/docs/deployment-methods/#git-post-receive-hook) for doing this in Jekyll's documentation. The `post-receive` hook outputs the HTML version of the blog in a directory on the host. I didn't want to give the `git` user that runs the hook the superuser privileges needed to write to the webroot directory in the jail that nginx runs in, so I added a `mount.fstab` attribute in the jail's description in `/etc/jail.conf` that automatically nullfs mounts the output directory to the correct place in the nginx jail's webroot.

The `/etc/jail.conf` entry for the nginx jail now looks something like

~~~ conf
# www
www {
   host.hostname = "www.devopps.me";
   ip4.addr = 172.16.1.1;
   mount.fstab = "/etc/fstab.www";
}
~~~

This reads a jail specific fstab file that Jekyll output directory as read-only into the nginx jail.

**Fun Fact:** This post was uploaded using the new git hook method.
