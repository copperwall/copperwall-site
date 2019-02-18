---
layout: post
title: Dockerizing Pulldasher
date: 2016-10-23 14:18:00
categories: how-to
---

This weekend I made some changes to [Pulldasher](https://github.com/ifixit/pulldasher) that allows it to be run in a [Docker](https://getdocker.com) container. Pulldasher is a dashboard for Github pull requests written by iFixit. It was open sourced about a year ago, and is the primary productivity tool that we use for viewing which pull requests are in need of review or testing, are blocked on further development, are failing tests, or are ready to be deployed. Describing Pulldasher probably deserves its own blog post, but all of the docker stuff is fresh, so I thought it'd be good to document this now.

## A little background

Pulldasher is a Node application that uses the [express](https://expressjs.com)  framework. It grabs issue, pull request, commit, and comment data from Github's API and stores it in a MySQL database. This means that the Pulldasher container can solely run the Node portion of the app, but you need to tell Pulldasher to connect to a MySQL server outside of the container. This can either be a MySQL instance installed directly on your host, or in another container, or somewhere else on your LAN/the Internet. For isolation and testing purposes, I chose to run a container running mysqld along with the Pulldasher container.

## Running a MySQL container

Running this command will pull down a docker image for the latest mysql and run the server in a container on your host.

~~~ sh
docker run --name="test-mysql" -e "MYSQL_ROOT_PASSWORD=mypassword" -d mysql
~~~

Just for testing's sake, the root password of the database is `mypassword` please feel free to make it more secure. If you leave it as `mypassword`, **_DO NOT MAKE THIS CONTAINER ACCESSIBLE FROM THE INTERNET_**. If you're running Pulldasher on a private Github repository, there will be issue, pull request, commit, and comment information stored in MySQL and you probably don't want that sitting on an open port on the Internet with a default password.

To explain the above command a little, `--name` gives the container a nice human-readable name that you can run operations on using `docker rm/inspect/etc`. `-e` lets you set an environment variable on the new container. `-d` is short for `--detach` and runs the container in the background. `mysql` is the docker image you will be running.

To view console information from a detached container, run `docker logs <container-name>`. To get the IP address that this container is using, run `docker inspect <container-name>` and look for the JSON field for IP address.

## Preparing Pulldasher

Clone the Pulldasher repo from [Github](https://github.com/ifixit/pulldasher) and `cd` into the directory. Copy the `config.example.js` file to `config.js` and fill in the appropriate Github application information. Once you have a target MySQL server running, edit the `config.js` file to point to it. If you're expecting to run the Pulldasher container at `localhost:8080`, make sure the callback URL for your Pulldasher Github application is set to the same URL.

Once you're all configured, run

~~~ sh
docker build -t pulldasher .
~~~

This will build a new Pulldasher docker image.

After that is done building, run

~~~ sh
docker run --name="test-pulldasher" --publish 8080:8080 -d pulldasher
~~~

The `--publish` flag is to map a port on the host to a port on the docker container. The syntax goes `--publish <host_port>:<container_port>`. This lets you access the Pulldasher by going to `localhost:8080` on your browser, instead of the IP address that the container is assigned. If you don't add this flag, you can still use `docker inspect <pulldasher_container_name>` to find the IP address and access the container from that IP address.

At this point Pulldasher should be up and running!

## Dockerfile Play by Play

Here's what the Dockerfile currently looks like, with some extra comments explain each command

~~~
# Grab the latest node image, since we only need node for Pulldasher.
FROM node:latest

# Create the directory in the container to run Pulldasher from.
RUN mkdir -p /opt/pulldasher
# Set the working directory to the Pulldasher directory.
WORKDIR /opt/pulldasher

# Install dependencies and copy the package.json from the current host directory to the container.
COPY package.json /opt/pulldasher
RUN npm install

# Copy the current host directory into the working directory in the container.
COPY . /opt/pulldasher

# Install npm and bower dependencies inside the container.
RUN npm install -g bower grunt-cli
RUN bower install --allow-root

# This makes the bootstrapcdn link the font path, instead of loading it locally.
RUN sed -i -e "/^@fa-font-path/d" bower_components/font-awesome/less/variables.less
RUN sed -i -e "s/\/\/@fa-font-path/@fa-font-path/" bower_components/font-awesome/less/variables.less

# Run grunt inside the container to run the linter and build less to css.
RUN grunt

EXPOSE 8080
CMD ["bin/pulldasher"]
~~~

## Things I could improve

Making changes to the Pulldasher source currently requires rebuilding the image to incorporate the changes into the container. This isn't super helpful for testing or debugging, so a better way of doing that is mapping your host's Pulldasher directory into the container so that when you make changes on the host, restarting the container will incorporate new changes. You can do this by adding a `-v <host_path>:<container_path>`.

If you use the MySQL container described earlier in this post, you will lose data when you stop the MySQL container. To fix this, mounting a host directory in `/var/lib/mysql` in the container should keep the MySQL databases around on your host.

## Things you could improve?

If there's something you think could be done better, please open an issue or make a pull request! The project is MIT licensed, so we more than welcome contributions :).
