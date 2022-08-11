# WP Local Docker

> WP Local Docker is an easy to use Docker based local development environment for WordPress development that works on Mac, Windows, and Linux.

[![Support Level](https://img.shields.io/badge/support-active-green.svg)](#support-level) [![Release Version](https://img.shields.io/github/release/10up/wp-local-docker-v2.svg)](https://github.com/10up/wp-local-docker-v2/releases/latest) [![MIT License](https://img.shields.io/github/license/10up/wp-local-docker-v2.svg)](https://github.com/10up/wp-local-docker-v2/blob/master/LICENSE)

## Documentation

### Introduction

WP Local Docker is an easy to use Docker based local development environment for WordPress development that works on Mac,
Windows, and Linux. Any number of environments can be created and may run at the same time<sup>[1](#faq)</sup>, and requests will be routed
appropriately to the correct environment based on the hostname specified during environment creation.

Each environment within WP Local Docker is powered by nginx, phpfpm, memcached, and if desired, elasticsearch. PHP versions
5.6, 7.0, 7.1, 7.2, 7.3, 7.4, or 8.0 are all supported. Supporting all environments within WP Local Docker is a MySQL container to run
all MySQL databases, WP Snapshots to easily push and pull snapshots of a WordPress installation, PHPMyAdmin to manage
MySQL databases with a familiar UI, and mailcatcher to catch any mail sent from all environments.

In addition to the services required to run WordPress, WP Local Docker will also download and install WordPress as a
single site installation, a Multisite with Subdirectories, a Multisite with Subdomains, or the core development version.

---
### Prerequisites

WP Local Docker requires [docker](https://www.docker.com/), [docker-compose](https://docs.docker.com/compose/), [Node](https://nodejs.org/en/), and npm. It is recommended that you use the latest versions of
docker and docker-compose. Node 12 is the minimum version of node that is currently supported. While WP Local Docker _may_ work with other versions of Node, compatibility is not guaranteed. We recommend using [NVM](https://github.com/nvm-sh/nvm) to manage Node versions.

#### MacOS
[Docker Desktop](https://docs.docker.com/docker-for-mac/install/) is available for download from the [Docker website](https://docs.docker.com/docker-for-mac/install/) and will
install docker-compose automatically. NodeJS and npm can be installed from the [NodeJS website](https://nodejs.org),
via a package manager, such as [Homebrew](https://brew.sh/), or using a version manager, such as
[nvm](https://github.com/creationix/nvm).

##### NodeJS EACCESS Error
If Node was installed via the download from the NodeJS website, you will likely get an `EACCESS` error when trying to install
global npm packages without using sudo. Npm has an article on [preventing permission errors](https://docs.npmjs.com/getting-started/fixing-npm-permissions#option-2-change-npms-default-directory-to-another-directory)
if you'd like to run the command without sudo. Alternatively, just run the install command with sudo.

#### Windows
[Docker Desktop](https://docs.docker.com/docker-for-windows/install/) is available for download from the [Docker website](https://docs.docker.com/docker-for-windows/install/) and will
install docker-compose automatically. NodeJS and npm can be installed from the [NodeJS website](https://nodejs.org). You may also need [Python](https://www.python.org/downloads/windows/) 3.7+ and [Visual Studio](https://visualstudio.microsoft.com/downloads/) 2015 or newer with the [“Desktop development with C++” workload](https://docs.microsoft.com/en-us/cpp/build/vscpp-step-0-installation?view=msvc-160).

It is recommended that you use the [WSL/2 backend for Docker](https://docs.docker.com/docker-for-windows/wsl/). You should use ([nvm](https://github.com/creationix/nvm) to install Node inside of your default Linux distro. Once you have, you can install WP Local Docker, from inside of Linux, following the [installation instructions](#Installation).

It is helpful to share git credentials between Windows and WSL/2. To do so, run the following, from inside of your default Linux, making sure to change `USER-NAME` to your Windows username:

```bash
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/libexec/git-core/git-credential-manager.exe"
cd ~/.ssh
cp /mnt/c/Users/USER-NAME/.ssh/id_rsa* .
```

You may need to setup shared root certificate for https to work correctly in browsers in Windows.
Inside WSL2 machine run:

```bash
mkcert -CAROOT
```

That will output the path to a certificate root directory which contains rootCA.pem file you will need to share with Windows.

Copy rootCA.pem file to any directory on Windows. In Windows PowerShell set that directory as CAROOT:

```bash
$Env:CAROOT = "C:\path\to\directory\with\certificate"
```

Then install certificate in Windows PowerShell with:

```bash
mkcert -install
```

That should fix the https issues.

If mkcert was not setup in WSL2 machine initially, you may need to install it inside WSL2 and run:

```bash
mkcert -install
```

You will need to regenerate certificates for sites:

```bash
10updocker cert generate yourwebsite.test
```

#### Linux
Docker has platform specific installation instructions available for linux on their [documentation site](https://docs.docker.com/install/#supported-platforms).
Once docker is installed, you will need to [manually install docker compose](https://docs.docker.com/compose/install/).
NodeJS can be installed via a package manager for many linux platforms [following these instructions](https://nodejs.org/en/download/package-manager/).

---
## Installation

Once all installation prerequisites have been met, WP Local Docker is installed as a global npm package by running
`npm install -g wp-local-docker`. You can confirm it has been installed by running `10updocker --version`.

### Configuration

The first time you run a WP Local Docker command, default configuration settings will be used if you have not manually
configured WP Local Docker beforehand. By default, WP Local Docker will store all environments within the
`~/wp-local-docker-sites` directory and try to manage your hosts file when creating and deleting environments. If you
would like to customize the environment path or opt to not have WP Local Docker update your hosts file, run
`10updocker configure` and follow the prompts.

### Updating

To update WP Local Docker, run `npm install -g wp-local-docker` again and NPM will install the latest version over your current one.

---
## Using WP Local Docker
### Create an Environment

`10updocker create` will present you with a series of prompts to configure your environment to suit your needs.

It is recommended that you use the `.test` top level domain (TLD) for your local environments, as this TLD is reserved
for the testing of software and is not intended to ever be installed into the global Domain Name System. Additionally,
WP Local Docker is configured to send any container to container traffic for .test TLDs directly to the gateway
container, so that things like WP Cron and the REST API can work between environments out of the box.

### Migrate a WP Local Docker V1 Environment

`10updocker migrate <OLD_PATH> [NEW_ENV]` will migrate an old standalone WP Local Docker environment into a new WP Local Docker V2
environment. Before running this command, create a new environment using the `10updocker create` command.

`OLD_PATH` should be the path to the root of your old WP Local Docker environment.

`NEW_ENV` should specify what environment to import into. If omitted, you will be prompted to select from available environments

Example:
* `10updocker migrate ~/sites/mysite`

### Migrate a WP Local Docker V2 Environment to v3

`10updocker configure` to update to the latest `.wplocaldocker/global/docker-compose.yml` and answer `yes` to ` Do you want to reset your global services configuration? This will reset any customizations you have made.`

### M1 Architecture consideration
To utilize the new M1 architecture optimised docker images on existing sites, edit the `docker-compose.yml` file to match a newly created on. Alternatively you can just create new sites and they will be optimised for M1 archtecture.

### Delete an Environment

`10updocker delete <hostname>` will delete an environment with the given hostname. Any local files, docker volumes, and
databases related to the environment will be deleted permanently.

A special hostname `all` is available that will delete all environments. You will be asked to confirm deletion of each
environment.

### Stop an Environment

`10updocker stop <hostname>` will stop an environment from running while retaining all files, docker volumes, and
databases related to the environment.

A special hostname `all` is available that will stop all running environments as well as the global services.

### Start an Environment

`10updocker start <hostname>` will start a preexisting environment.

A special hostname `all` is available that will start all environments as well as the global services.

### Restart an Environment

`10updocker restart <hostname>` will restart all services associated with a preexisting environment.

A special hostname `all` is available that will restart all environments as well as the global services.

### Upgrade an Environment

`10updocker upgrade <hostname>` will upgrade all services associated with a preexisting environment.

This command will assist you with keeping your environments up to date with the most recent upstream changes.

If the environment was created before `v2.6.0`, we recommend upgrading your environment for a noticeable
performance increase.

If the environment was created before `v3.0.1`, this will update the elasticsearch image. When updating the elasticsearch image, we need to delete the docker volume so you will need to reindex after running this command.
### Elasticsearch

If you have enabled Elasticsearch for a particular environment, you can send requests from the host machine to the
Elasticsearch server by prefixing the url path with `/__elasticsearch/`. For example, if you wanted to hit the
`/_all/_search/` endpoint of Elasticsearch, the URL would look like: `http://<hostname>/__elasticsearch/_all/_search`

### WP Snapshots

See the section on [using WP Snapshots](#user-content-wpsnapshots)

### Running WP CLI Commands

Running WP CLI commands against an environment is easy. First, make sure you are somewhere within your environment
directory (by default, this is somewhere within `~/wp-local-docker-sites/<environment>/`). Once within the environment
directory, simply run `10updocker wp <command>`. `<command>` can be any valid command you would otherwise pass directly
to WP CLI.

Examples:
* `10updocker wp search-replace 'mysite.com' 'mysite.test'`
* `10updocker wp site list`

### Shell

You can get a shell inside of any container in your environment using the `10updocker shell [<service>]` command. If a
service is not provided, the `phpfpm` container will be used by default. Other available services can vary depending
on the options selected during creation of the environment, but may include:
* `phpfpm`
* `nginx`
* `elasticsearch`
* `memcached`

### Logs

Real time container logs are available using the `10updocker logs [<service>]` command. If a service is not provided,
logs from all containers in the current environment will be shown. To stop logs, type `ctrl+c`. Available services can
vary depending on the options selected during creation of the environment, but may include:
* `phpfpm`
* `nginx`
* `elasticsearch`
* `memcached`

### Clearing Shared Cache
WP CLI, WP Snapshots, and npm (when building the development version of WordPress) all utilize cache to speed up
operations and save on bandwidth in the future.

`10updocker cache clear` Clears the WP CLI, WP Snapshots, and npm (for WordPress core development) caches.

### Updating Docker Images
`10updocker image update` Will determine which of the docker images utilized by WP Local Docker are present on your
system and update them to the latest version available.

### Stopping global services
WP Local Docker relies on a set of global services to function properly. To turn off global services, run
`10updocker stop all`. This will stop all environments and then the global services.

---
### Tools

#### phpMyAdmin

[phpMyAdmin](https://www.phpmyadmin.net/) is available as part of the global services stack that is deployed to support all of the environments.

Access phpMyAdmin by navigating to [http://localhost:8092](http://localhost:8092).
* Username: `wordpress`
* Password: `password`

#### MailCatcher

[MailCatcher](https://mailcatcher.me/) is available as part of the global services stack that is deployed to support all of the environments. It is preconfigured to catch mail sent from any of the environments created by WP Local Docker.

Access MailCatcher by navigating to [http://localhost:1080](http://localhost:1080).

#### Xdebug version 3

Make sure you are running the expected version by running:

```bash
php -v | grep Xdebug
```

The command needs to be executed on the docker image of PHP in order to get the right version of docker running
on that container.

The command above would return an ouput like:

```
    with Xdebug v3.1.1, Copyright (c) 2002-2021, by Derick Rethans
```


Update the configuration file on your site usually located at `config/php-fpm/docker-php-ext-xdebug.ini` in order to
be updated to the new settings for `Xdebug 3`.

```
xdebug.client_host = host.docker.internal;
xdebug.mode = develop,debug
xdebug.start_with_request = yes
xdebug.output_dir = /var/www/html/wp-content
xdebug.log=/var/www/html/wp-content

```

Make sure to restart your docker image after this changes or stop / start. To verify your changes were applied you can create a file
called `info.php` and add `<?php phpinfo(); ?>` at the root of your project and then visit `yourdomain.com/info.php` and look for
the values described above to verify your settings were actually applied, if that's not the case verify the path for your
`xdebug.ini` file is actually placed into the right location.

Open the file `docker-compose.yml` and update the line:

```
'./config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/docker-php-ext-xdebug.ini:cached'
```

with:  (For PHP7.4) specifically it might vary depdending on your PHP version.

```
'./config/php-fpm/docker-php-ext-xdebug.ini:/etc/php/7.4/fpm/conf.d/99-ext-xdebug.ini:cached'
```


#### PHPStorm

Go to `Settings > PHP > Debug`.

- Set the port to `9003`
- Check (Ignore external connections through unregistered server configurations) to avoid wait on non wanted files.
- Check (Resolve breakpoint if it's not available on the current line)
- Uncheck (Force break at first line when no path mapping specified)
- Uncheck (Force break at frist line when a script is outside the project)

Go to `Settings > PHP > Servers`.

- Add a new server with the following settings:
  - `name: yourdomain.com`
  - `host: localhost`
  - `port: 80`
  - `debugger: Xdebug`
  - Enable `Use path mappings (select if the server is remote or symlinks are used)`
  - Within the map directory select the path you want to debug (usually `wp-content`) and map it to `/var/www/html/wp-content`

- Save your settings
- Start to listen for connections on the top bar of your IDE (red phone icon)


#### Visual Studio Code

1. Ensure Xdebug is enabled for the environment using the `ENABLE_XDEBUG` environment variable.
2. Install the [PHP Debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug) extension.
3. In your project, go to the Debug view, click "Add Configuration..." and choose PHP environment. A new launch configuration will be created for you.
4. Set the `pathMappings` parameter to your local `wordpress` directory. Example:

```json
"configurations": [
        {
            "name": "Listen for XDebug",
            "type": "php",
            "request": "launch",
            "port": 9003,
            "pathMappings": {
                "/var/www/html": "${workspaceFolder}/wordpress",
            }
        }
]

```

#### Xdebug version 2


Xdebug is included in the php images but must be manually enabled if you use wp-local-docker 2.7.0 or earlier. To enable Xdebug, set the environment variable `ENABLE_XDEBUG` to `'true'` in the `docker-compose.yml` file in the root of the project. If you use wp-local-docker 2.8.0 or higher, then new environments will have Xdebug enabled by default.

Make sure your IDE is listening for PHP debug connections and set up a path mapping to your local environment's `wordpress/` directory to `/var/www/html/` in the container.

#### Visual Studio Code

1. Ensure Xdebug is enabled for the environment using the `ENABLE_XDEBUG` environment variable.
2. Install the [PHP Debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug) extension.
3. In your project, go to the Debug view, click "Add Configuration..." and choose PHP environment. A new launch configuration will be created for you.
4. Set the `pathMappings` parameter to your local `wordpress` directory. Example:

```json
"configurations": [
        {
            "name": "Listen for XDebug",
            "type": "php",
            "request": "launch",
            "port": 9000,
            "pathMappings": {
                "/var/www/html": "${workspaceFolder}/wordpress",
            }
        }
]
```

#### WPsnapshots
##### Configuration

If you have not used [WP Snapshots](https://github.com/10up/wpsnapshots) with [WP Local Docker](https://github.com/10up/wp-local-docker-v2) yet, you'll first need to configure WP Snapshots with your AWS
credentials. To configure, run `10updocker wpsnapshots configure <repository>` (e.g. `10updocker wpsnapshots configure 10up`). You will then be prompted to enter
your AWS credentials and a few other configuration details. Once complete, the configuration will be available across
all of your WP Local Docker environments.

##### Pulling an Environment

`10updocker wpsnapshots pull <snapshot-id>` This command pulls an existing snapshot from the repository into your current
environment, replacing your database and wp-content. This command must be run from withing your environment directory
(by default, this is somewhere within `~/wp-local-docker-sites/<environment>/`).

##### Searching for an Environment

`10updocker wpsnapshots search <search-term>` with searches the repository for snapshots. `<search-text>` will be
compared against project names and authors. Searching for "*" will return all snapshots.

##### Other Commands

`10updocker wpsnapshots <command>` is the general form for all WP Snapshots commands. `<command>` is passed directly to
WP Snapshots, so any command that WP Snapshots accepts will work in this form. Any command that requires a WordPress
environment (pull, create, etc) needs to be run from somewhere within an environment directory (by default, this is
somewhere within `~/wp-local-docker-sites/<environment>/`).

---

## F.A.Q

### Can I run as many concurrent enviroments as I want?
Concurrent environments are limited by the available resources of your host machine.

### I am having issues with wp-local-docker, what are the best troubleshooting techniques?
First make sure that Docker and Node are up to date. Then ensure that wp-local-docker is up to date as well by running `npm i -g wp-local-docker`. Once we are sure everything is up to date, it's generally a good idea to restart docker.

Now we will want to make sure we are using the latest of the docker images by running `10updocker image update`.

Then run `10updocker configure` and answer `Yes` to `Do you want to reset your global services configuration? This will reset any customizations you have made.`

Once you have reset the global configuration then you will want to reset the specific instance that is having the issue. You can do this by running `10updocker upgrade`. This will replace the `docker-compose.yml` file for that particular site instance.

### How to ignore `node_modules/` in your container?
One of the primary performance bottlenecks with Docker for Mac is file syncing between the host machine and the Docker containers. The less files that are mounted into the Docker container volumes, the less work Docker needs to do ensuring those files are synced. NPM and the /node_modules/ directories are the worst offenders by far. Since assets are transpiled/compiled from source prior to being used on the frontend, the dependencies in `node_modules/` are not actually required to run the site locally, only the compiled dist files.

In order to mitigate the additional pressure `node_modules/` puts on Docker filesystem syncing, we can instruct Docker to ignore directories when mounting volumes. Technically, we are instructing Docker to mount nothing to a specific path on the volume, but the effect is the same. See below for a practical example of how one might edit the `docker-compose.yml` file in the site root:

```
nginx:
    ...
    volumes:
        - './wordpress:/var/www/html:cached'
        - '/var/www/html/wp-content/themes/{my-theme}/node_modules'
        - '/var/www/html/wp-content/plugins/{my-plugin}/node_modules'
phpfpm:
    ...
    volumes:
        - './wordpres:/var/www/html:cached'
        - '/var/www/html/wp-content/themes/{my-theme}/node_modules'
        - '/var/www/html/wp-content/plugins/{my-plugin}/node_modules'
```

Note: This action cannot be performed automatically as the specific paths to `node_modules/` cannot be determined. You will need to manually determine the path where `node_modules/` will be mounted onto the volume.

Once you have made the appropriate changes in your `docker-compose.yml` file, you must stop and start for the changes to take effect and confirm things have worked.

### How do I upgrade an environment to a new version of PHP?
To upgrade to a newer version of PHP, please edit the `docker-compose.yml` file in the environment you are updating.
From:

```
  phpfpm:
    image: '10up/wp-php-fpm-dev:5.6-ubuntu'
    ...
    volumes:
      - './wordpress:/var/www/html:cached'
      - './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/5.6/fpm/docker-php-ext-xdebug.ini:cached'
```

To:

```
  phpfpm:
    image: '10up/wp-php-fpm-dev:7.4-ubuntu'
    ...
    volumes:
      - './wordpress:/var/www/html:cached'
      - './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/7.4/fpm/docker-php-ext-xdebug.ini:cached'
```

Once you update this run `docker-compose down` and `docker-compose up` to rebuild the containers.

### Avoiding conflicts with other local dev environments (Valet, MAMP, etc) on macOS

If you are running something like MAMP or Laravel Valet on your Mac, it is possible you may have port conflicts when attempting to use wp-local-docker, such as:

```
Cannot start service mysql: Ports are not available: listen tcp 127.0.0.1:3306: bind: address already in use
```

For the above error, that indicates that the `mysqld` process is already running using that same port (3306). To confirm what ports are currently in use on your Mac, run the following command in your terminal:

```bash
sudo lsof -i -P | grep LISTEN

# Alternatively you can search for the specific port in your error, substituting 3306 the port you want.
sudo lsof -i -P | grep :3306
```

If you see a process that is using that port, that process should be stopped before you attempt to start or create any new environments with wp-local-docker.

If you installed `mysqld` via Homebrew, you need to stop the process via Homebrew:

```
brew services stop mysql
```

Once you stop the service re-run the `lsof` command above to verify the port is no longer in use.

### What if I want to modify the default ports for global services?

While you could modify the port configuration globally or per project, _this will require making adjustments in other areas_ to prevent a permissions error when starting up the database, such as:

```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost' (using password: YES)
```

For best results we recommend using the default port configuration whenever possible.

---
## Support Level
**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.
#### Like what you see?
<a href="https://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850"></a>
