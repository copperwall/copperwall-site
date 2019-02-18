---
layout: post
title:  "Dockerizing Pulldasher 2: Docker Compose"
date:   2017-02-13 20:00:00
categories: docker how-to
---

I wrote a post about [using Pulldasher with Docker](https://devopps.me/blog/how-to/2016/10/23/dockerizing-pulldasher.html) a few months ago to explain how to use Docker to run Pulldasher or debug Pulldasher anywhere. One of the shortcomings of that post was that it required keeping track of two independent containers in order to run Pulldasher locally. The end result was either needing an already configured MySQL database to connect to (not great when internet sucks) or always needing to be aware of whether or not a local MySQL container is up and what IP address it has (annoying to keep track of). This post explores using `docker-compose` to set up "one-click" Pulldasher installs. The main inspiration behind this new setup was to make it as seemless as possible to go from cloning the project to having a funcitonal instance.

## Preparation

This section describes changes made to Pulldasher to make setup with `docker-compose` more user-friendly.

When I was [setting up CallPower](https://devopps.me/blog/how-to/docker/2017/02/03/using-docker-compose-with-multi-service-apps.html) with `docker-compose`, I was really impressed by how easy it was to start and stop a full web application without having to manually create database tables, run migration scripts, etc. The current Pulldasher configuration routine requires manually creating a database, `source`-ing a `schema.sql` file to create the tables that the application is expecting, and then starting the node application. All of these steps have been manual, because Pulldasher was developed on EC2 instances, where the test database was always reachable and properly configured. Pulldasher has never really had a migration system, but this hasn't been a problem because the schema has been fairly static for the last two years.

For a quick solution, I added a new script called `migrate.js` to the repo, which will run the `schema.sql` file on the database specified in `config.js`. I also modified the `schema.sql` file to not drop tables if they already exist and to not complain if the table already exists. My goal was that this script could be run everytime Pulldasher starts and if the database was not configured, it would be automatically. Otherwise, the script would have no effect on the database and Pulldasher would start as normal.

~~~js
// migrate.js
var mysql = require('mysql'),
    config = require('./config'),
    fs = require('fs');

var db = mysql.createConnection({
   host: config.mysql.host,
   database: config.mysql.db,
   user: config.mysql.user,
   password: config.mysql.pass,
   multipleStatements: true
});

console.log("Running this script will initalize your database for pulldasher.");
console.log("It will not drop any existing tables.");

fs.readFile('./schema.sql', function(err, data) {
   if (err) {
      throw err;
   }

   db.query(data.toString(), function(err, res, fields) {
      // If the connection fails, return a failure code so that entrypoint.sh
      // will retry this script.
      if (err) {
         console.log(err);
         process.exit(1);
      }

      db.end(function(err) {
         if (err) {
            throw err;
         }
      });
   });
});
~~~

If the Pulldasher database schema becomes more dynamic it will probably be worth the effort to add in a migration system or switch to a more ORM-like MySQL node package, but for now this solution seems to do the job. Using a new shell script called `entrypoint.sh`, we can start Pulldasher by running `migrate.js` and `bin/pulldasher` sequentially.

~~~sh
#!/bin/sh
# Entrypoint for docker-compose service

# Wait for the DB to start accepting connections.
for i in $(seq 5); do
   echo "Attempt $i"
   node migrate.js && break || sleep 10
done

echo "Setup done, starting pulldasher..."

# Start pulldasher
node bin/pulldasher

~~~

## The docker-compose configuration

Now that there's a way to automatically configure the database from the first time Pulldasher starts up, we can move on to actually specificying how we want the services/containers that make up Pulldasher to relate.

### Web

`web` is the container that will run the main node application. This container's image is built from the Dockerfile that the previous Pulldasher blog post explains, but the actual container will have a few modifications. This procedure is meant for development, so it's helpful to mount the current host directory to the working directory of the container. By doing this, we can modify the code locally and have the changes immediately reflected in the container. Without this, we would have to rebuild the image everytime we change some code, which would eat up a lot of time. The container's working directory is `/opt/pulldasher`, so we can specify a volume for the `web` container in `docker-compose.yml` that maps `.` to `/opt/pulldasher`. We also need to specify an image to create the container from. If there was a pulldasher image on a Docker registry, we could specify that name as an `image` field, but since we have the Dockerfile in the current directory we can specify a `build: .` field, which tells `docker-compose` to build a Docker image using a `Dockerfile` in the current directory. We also need to override the `ENTRYPOINT` specified in the Dockerfile. By default, a Pulldasher image will start by running `bin/pulldasher`, but in order to make sure MySQL is set up correctly, we want to run the new `entrypoint.sh`, which will run `migrate.js` and then run `bin/pulldasher`. Finally, publishing the container's port 8080 to the host's port 8080 will let use access the node application through `localhost:8080`.

The `web` portion of the `docker-compose.yml` file should look like.

~~~
version: '2'

services:
	web:
		build: .
		entrypoint: '/opt/pulldasher/entrypoint.sh'
		ports:
			- 8080:8080                # Map the container's port 8080 to the host's 8080
												# NOTE: The host port will need to match
												# the callback URL specified in the GitHub
												# application setting.
		volumes:
			- .:/opt/pulldasher        # Mount the current directory to /opt/pulldasher
~~~

### DB

`db` is the MySQL container that `web` will use to store data in. The configuation needs to specify the user, password, and database that Pulldasher is configured to connect to. It also needs to specify a persistent volume so that shutting down Pulldasher won't destroy the data stored in the `db` container. The `db` portion of the config file defines the necessary environment variables to start MySQL with, a `MariaDB` image to start the container from, a persistent volume named `db_data`, which is mounted to `/var/lib/mysql`.

The complete `docker-compose.yml` should look like this.

~~~
version: '2'

services:
   web:
      build: .
      entrypoint: '/opt/pulldasher/entrypoint.sh'
      ports:
         - 8080:8080                # Map the container's port 8080 to the host's 8080
                                    # NOTE: The host port will need to match
                                    # the callback URL specified in the GitHub
                                    # application setting.
      volumes:
         - .:/opt/pulldasher        # Mount the current directory to /opt/pulldasher
   db:
      image: "mariadb:latest"
      volumes:
         - db_data:/var/lib/mysql   # Create a persistent volume so that we don't lose data between restarts
      environment:
         # Please use strong passwords if you are deploying pulldasher in a
         # production environment.
         MYSQL_ROOT_PASSWORD: pulldasher
         MYSQL_DATABASE: pulldasher
         MYSQL_USER: pulldasher
         MYSQL_PASSWORD: pulldasher
volumes:
   db_data:
~~~

## What Now?

Before running starting the containers, you should run `npm install` to make sure that all of the dependencies are downloaded and assets are built. Once that's done, you can run `docker-compose up` and you should have a local instance of Pulldasher up and running.

## Weird Stuff

When writing `entrypoint.sh`, I noticed that `migrate.js` would fail to connect to MySQL, especially when the MySQL container was starting on a fresh volume with zero configuration. In order to get around this, I built in a retry loop in `entrypoint.sh` that tries to run `migrate.js` five times with 10 seconds of sleep in between each attempt before giving up. This seemed to be the accepted thing to do.
