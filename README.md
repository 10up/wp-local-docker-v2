# WP Local Docker

> WP Local Docker is an easy to use Docker based local development environment for WordPress development that works on Mac, Windows, and Linux. 

[![Support Level](https://img.shields.io/badge/support-active-green.svg)](#support-level) [![Release Version](https://img.shields.io/github/release/10up/wp-local-docker-v2.svg)](https://github.com/10up/wp-local-docker-v2/releases/latest) [![MIT License](https://img.shields.io/github/license/10up/wp-local-docker-v2.svg)](https://github.com/10up/wp-local-docker-v2/blob/master/LICENSE)

## Documentation

### Introduction

WP Local Docker is an easy to use Docker based local development environment for WordPress development that works on Mac,
Windows, and Linux. Any number of environments can be created and may run at the same time[^1], and requests will be routed
appropriately to the correct environment based on the hostname specified during environment creation.

Each environment within WP Local Docker is powered by nginx, phpfpm, memcached, and if desired, elasticsearch. PHP versions
5.5, 5.6, 7.0, 7.1, 7.2 or 7.3 are all supported. Supporting all environments within WP Local Docker is a MySQL container to run
all MySQL databases, WP Snapshots to easily push and pull snapshots of a WordPress installation, PHPMyAdmin to manage
MySQL databases with a familiar UI, and mailcatcher to catch any mail sent from all environments.

In addition to the services required to run WordPress, WP Local Docker will also download and install WordPress as a
single site installation, a Multisite with Subdirectories, a Multisite with Subdomains, or the core development version.

[^1]: Concurrent environments are limited by the available resources of your host machine
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

To update WP Local Docker, run `npm update -g wp-local-docker`

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

This command will assist you with keeping your environments up to date with the most recent upstream changes. If you
are running an environment that was created before `v2.6.0`, we recommend upgrading your environment for a noticeable
performance increase.

### Elasticsearch

If you have enabled Elasticsearch for a particular environment, you can send requests from the host machine to the
Elasticsearch server by prefixing the url path with `/__elasticsearch/`. For example, if you wanted to hit the
`/_all/_search/` endpoint of Elasticsearch, the URL would look like: `http://<hostname>/__elasticsearch/_all/_search`

### WP Snapshots

See the section on [using WP Snapshots](../wp-snapshots)

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

#### Xdebug

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
## Support Level
**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.
#### Like what you see?
<a href="https://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850"></a>
