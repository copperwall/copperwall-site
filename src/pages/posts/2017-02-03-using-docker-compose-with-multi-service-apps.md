---
layout: post
title: Using Docker Compose with web apps
date: 2017-02-03 00:00:00
categories: how-to docker
---

## Inspiration

I recently got to set up a multi-service web app with [Docker Compose](https://docs.docker.com/compose/). I found that Docker Compose handled most of the problems that I've ran across when trying to "dockerize" web apps that have multiple components. One example of that is [Pulldasher](https://github.com/ifixit/pulldasher), a GitHub pull request dashboard written by iFixit. Pulldasher is made up of an Express (Node.js) application and a MySQL database. Making a container around the Express application seemed simple enough, but creating a setup such that I can have a MySQL container spin up and tear down in sync with the Pulldasher container seemed like something I would have to automate myself using a shell script.

## Introduction to Docker Compose

### Up and Running
I wasn't aware of Docker Compose until I had to set up a [CallPower](https://callpower.org) instance for [Repair.org](https://repair.org). CallPower is an open source service that lets advocacy groups help constituents contact each of their representatives at a State or Federal level. The service ties together data from the OpenStates API and Sunlight Foundation and uses Twilio to connect constituents with their representatives. CallPower includes a `Dockerfile` which lets you build a container around the main application, which is a Flask app. It also includes a lightweight `docker-compose.yml` file, which specifies a single service named _calltool_, along with how to build that service's Docker image, which ports to forward, and which environment varibles to start the service with. As is, the `docker-compose.yml` will build an image for you with the name `<current-directory>_<service-name>`,  start a container from that image named `<current-directory>_<service-name>_1`, forward the container's port `5000` to your host machine's `5000` and start the Flask app with the environment variables given. This all happens by running `docker-compose up` in the same directory as the `docker-compose.yml` file. Pretty cool.

Here's a copy of the example `docker-compose.yml` given with CallPower.

~~~conf
version: '2'

services:
  calltool:
    build: .  # tells docker-compose where to look for the Dockerfile to build the calltool Docker image.
    environment:        # Environment variables for the Flask app
      FLASK_ENV: development # or development-expose or production
      SUNLIGHT_API_KEY:
      TWILIO_DEV_ACCOUNT_SID:
      TWILIO_ACCOUNT_SID:
      TWILIO_DEV_AUTH_TOKEN:
      TWILIO_AUTH_TOKEN:
      SECRET_KEY:
      ADMIN_API_KEY:
      CALLPOWER_CONFIG: call_server.config:DevelopmentConfig # or call_server.config:ProductionConfig
      APP_HOST: 0.0.0.0
    ports:
      - "5000:5000"     # Map the container's port 5000 to the host's port 5000
~~~

### Going Full Container
While that's pretty neat for starters, Callpower requires a Redis server for caching and a SQL database for use with SQLAlchemy in the Flask app. Connection URLs for these servers can easily be passed to the _calltool_ container through environment variables, so if you have a Redis and MySQL/Postgres/sqlite server somewhere on the internet or your LAN to connect to, that's all you need to get started. _However_, if you'd like to be able to set up everything the application needs on your own host, you'll need to add Redis and SQL database services to the `docker-compose.yml`.

#### MariaDB with Volumes
Callpower requires a SQL database to store Admin credentials, call campaign information, call statistics, and voice recordings to play in each campaign phone call. For this example, we'll add another service to the `docker-compose.yml` file to tie together with our calltool service defined previously. We'll need to specify a service name, Docker image, and list of environments variables to start the database with. For this example we'll use MariaDB/MySQL.

~~~conf
version: '2'

services:
  calltool:
    build: .  # tells docker-compose where to look for the Dockerfile to build the calltool Docker image.
    environment:        # Environment variables for the Flask app
      FLASK_ENV: development # or development-expose or production
      SUNLIGHT_API_KEY:
      TWILIO_DEV_ACCOUNT_SID:
      TWILIO_ACCOUNT_SID:
      TWILIO_DEV_AUTH_TOKEN:
      TWILIO_AUTH_TOKEN:
      SECRET_KEY:
      ADMIN_API_KEY:
      CALLPOWER_CONFIG: call_server.config:DevelopmentConfig # or call_server.config:ProductionConfig
      APP_HOST: 0.0.0.0
    ports:
      - "5000:5000"     # Map the container's port 5000 to the host's port 5000
  db:
    image: "mariadb:latest"     # Use the latest MariaDB Docker image
    volumes:
     - db_data:/var/lib/mysql   # Mount the db_data volume onto /var/lib/mysql
    environment:                # Set the MySQL environment variables
      MYSQL_ROOT_PASSWORD:
      MYSQL_DATABASE:
      MYSQL_USER:
      MYSQL_PASSWORD:
volumes:
  db_data:          # Define the db_data volume
~~~

There are a couple things of note in the new `docker-compose.yml` file.
* _db_ is defined as another service
* _db_ has an _image_ attribute instead of a _build_ attribute. This is because we can grab the default MariaDB image.
* _db_ has a _volumes_ attribute that specifies that a *db_data* volume is mounted to `/var/lib/mysql` in the container
* There is a new top level attribute called _volumes_, which contains a simple volume called *db_data*.

Now that we've defined a _db_ service, it will be brought up and shut down whenever we run `docker-compose up/down`. Another very useful aspect is that the _calltool_ service can contact the _db_ service using the service name as a domain name. For example, if you defined a MySQL connection string to tell the Flask app where to find the MySQL database, you could give it `mysql://<user>:<pass>@db/<db_name>`. Through some DNS magic (probably DNS?), the `db` domain name will resolve to the container's IP address. Something else that's important when using a database is to make sure it's storage doesn't disappear when you shut it down. Without defining a volume, the filesystem used by the _db_ service would be deleted on shutdown and all of your data would be gone. To specify that we long storage that exists outside of a container's lifespan, we add a _volume_. The volume configuration above is all you need to define a simple volume and mount it on your container when it starts up. If you'd like to see where that volume actually exists on your host filesystem, you can run `docker volume <volume_name>`. The volume name in this case should be `callpower_db_data`.

The output should look like this:
~~~
[
    {
        "Name": "callpower_db_data",
        "Driver": "local",
        "Mountpoint": "/var/lib/docker/volumes/callpower_db_data/_data",
        "Labels": null,
        "Scope": "local"
    }
]
~~~

The filepath described in `Mountpoint` is where the volume exists outside of your container. At this point running `docker-compose.yml` will bring up the `callpower_calltool_1` container and the `callpower_db_1` container.

#### Redis
The last running service needed is _Redis_. For development purposes, you can add a service named _redis_ with and _image_ value of `redis:alpine` and your Flask application will be able to reach it at `redis://redis:6379`, without any further configuration. Just like with the _db_ service, your Flask app will be able to reach this container over the network by the domain name `redis`. With this configuration, the container won't be exposed to the internet, but if you're planning on running this service anywhere other than your laptop you should take measures to secure it with a strong password.

The final `docker-compose.yml` looks like:

~~~
version: '2'

services:
  calltool:         # calltool is the container that runs the Flask application
    build: .  # tells docker-compose where to look for the Dockerfile to build the calltool Docker image.
    environment:        # Environment variables for the Flask app
      FLASK_ENV: development # or development-expose or production
      SUNLIGHT_API_KEY:
      TWILIO_DEV_ACCOUNT_SID:
      TWILIO_ACCOUNT_SID:
      TWILIO_DEV_AUTH_TOKEN:
      TWILIO_AUTH_TOKEN:
      SECRET_KEY:
      ADMIN_API_KEY:
      CALLPOWER_CONFIG: call_server.config:DevelopmentConfig # or call_server.config:ProductionConfig
      APP_HOST: 0.0.0.0
    ports:
      - "5000:5000"     # Map the container's port 5000 to the host's port 5000
  redis:        # redis is the container that runs redis
    image: "redis:alpine"
  db:           # db is the container that runs MariaDB/MySQL
    image: "mariadb:latest"     # Use the latest MariaDB Docker image
    volumes:
     - db_data:/var/lib/mysql   # Mount the db_data volume onto /var/lib/mysql
    environment:                # Set the MySQL environment variables
      MYSQL_ROOT_PASSWORD:
      MYSQL_DATABASE:
      MYSQL_USER:
      MYSQL_PASSWORD:
volumes:
  db_data:          # Define the db_data volume
~~~

Running `docker-compose up` should start three containers named `callpower_calltool_1`, `callpower_redis_1`, and `callpower_db_1`. Running `docker-compose down` will stop each of the containers.

### Takeaways

`docker-compose` is a pretty simple way of specifying and organizing multiple services under a single configuration. Since most of the web apps I work on have at least a backend application and SQL server component, I'm planning on using this to more easily do web development and testing on my laptop, without needing to stay connected to a development server in the cloud. I'll probably do a follow up to my _Dockerizing Pulldasher_ post with a how-to Pulldasher setup with `docker-compose`.
