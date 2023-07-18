# WP Local Docker

> WP Local Docker is an easy to use Docker based local development environment for WordPress development that works on Mac, Windows, and Linux.

[![Support Level](https://img.shields.io/badge/support-active-green.svg)](#support-level) [![Release Version](https://img.shields.io/github/release/10up/wp-local-docker-v2.svg)](https://github.com/10up/wp-local-docker-v2/releases/latest) [![MIT License](https://img.shields.io/github/license/10up/wp-local-docker-v2.svg)](https://github.com/10up/wp-local-docker-v2/blob/master/LICENSE)

---

> **Note**<br>
> Version 4 of WP Local Docker has been released and contains breaking changes.<br>
> Please follow the [migration instructions](#migrate-a-wp-local-docker-v2-environment-to-v400-) when upgrading.

---

## Table of Contents

* [Introduction](#introduction)
* [Prerequisites](#prerequisites)
	+ [MacOS](#macos)
	+ [Windows](#windows)
	+ [Linux](#linux)
* [Installation](#installation)
	+ [Configuration](#configuration)
	+ [Updating](#updating)
* [Using WP Local Docker](#using-wp-local-docker)
	+ [Create an Environment](#create-an-environment)
	+ [Start an Environment](#start-an-environment)
	+ [Stop an Environment](#stop-an-environment)
	+ [Configure an Environment](#configure-an-environment)
	+ [Restart an Environment](#restart-an-environment)
	+ [Upgrade an Environment](#upgrade-an-environment)
	+ [Delete an Environment](#delete-an-environment)
* [Advanced Usage](#advanced-usage)
	+ [Managing Certificates](#managing-certificates)
	+ [Elasticsearch](#elasticsearch)
	+ [Running WP CLI Commands](#running-wp-cli-commands)
	+ [Getting a Shell Inside a Container](#getting-a-shell-inside-a-container)
	+ [Accessing Container Logs](#accessing-container-logs)
	+ [Clearing Shared Cache](#clearing-shared-cache)
	+ [Updating Docker Images](#updating-docker-images)
	+ [Stopping Global Services](#stopping-global-services)
* [Tools](#tools)
	+ [phpMyAdmin](#phpmyadmin)
	+ [MailCatcher](#mailcatcher)
	+ [Xdebug version 3](#xdebug-version-3)
	+ [Xdebug version 2](#xdebug-version-2)
	+ [Snapshots](#snapshots)
		- [Configuration](#configuration-1)
		- [Pulling an Environment](#pulling-an-environment)
		- [Searching for an Environment](#searching-for-an-environment)
		- [Other Commands](#other-commands)
* [F.A.Q](#faq)
* [Troubleshooting](#troubleshooting)
* [Migrating from Older Versions](#migrating-from-older-versions)
	+ [Migrate a WP Local Docker V1 Environment](#migrate-a-wp-local-docker-v1-environment)
	+ [Migrate a WP Local Docker V2 Environment to v3.0.0+](#migrate-a-wp-local-docker-v2-environment-to-v300-)
	+ [Migrate a WP Local Docker V2 Environment to v4.0.0+](#migrate-a-wp-local-docker-v2-environment-to-v400-)

## Introduction

WP Local Docker is an easy to use Docker based local development environment for WordPress development that works on Mac,
Windows, and Linux. Any number of environments can be created and may run at the same time<sup>[1](#faq)</sup>, and requests will be routed
appropriately to the correct environment based on the hostname specified during environment creation.

Each environment you create in WP Local Docker is powered by a couple of services you may already be familiar with:

- **nginx**: a high-performance HTTP server and reverse proxy,
- **phpfpm**: a fast and robust PHP FastCGI process manager,
- **memcached**: a distributed memory object caching system,
- **elasticsearch** (optional): a search and analytics engine.

You can choose to run your environment on different versions of PHP including 5.6, 7.0, 7.1, 7.2, 7.3, 7.4, 8.0, 8.1 or 8.2.

WP Local Docker comes with features that make managing your WordPress development a breeze:

- **MySQL container**: Handles all the MySQL databases across your environments,
- **WP Snapshots**: Allows you to easily create and use snapshots of your WordPress installation,
- **PHPMyAdmin**: Provides a user-friendly interface to manage your MySQL databases,
- **mailcatcher**: Catches any mail sent from your environments.

Lastly, WP Local Docker also takes care of downloading and installing WordPress for you. You can choose between a single site installation, a Multisite with Subdirectories, a Multisite with Subdomains, or the core development version.

---

## Prerequisites

WP Local Docker requires a few tools to function properly:

- [Docker](https://www.docker.com/)
- [Docker-compose](https://docs.docker.com/compose/)
- [Node](https://nodejs.org/en/)
- [npm](https://docs.npmjs.com/about-npm)

For the best experience, we recommend using the latest versions of Docker and Docker-compose. As for Node, the minimum supported version is Node 16. While WP Local Docker may work with other versions, we can't guarantee full compatibility. To manage Node versions, consider using [NVM](https://github.com/nvm-sh/nvm).

### MacOS

On a Mac? Great! You can get [Docker Desktop](https://docs.docker.com/docker-for-mac/install/) from the Docker website. It comes with Docker-compose installed. For NodeJS and npm, you can install them from the [NodeJS website](https://nodejs.org), via a package manager like [Homebrew](https://brew.sh/), or using NVM.

##### NodeJS EACCESS Error

Did you install Node from the NodeJS website? If so, you might encounter an `EACCESS` error when trying to install global npm packages without using sudo. To prevent this, check out npm's guide on [preventing permission errors](https://docs.npmjs.com/getting-started/fixing-npm-permissions). Or, you can simply run the install command with sudo.

### Windows

If you're on Windows, you can download [Docker Desktop](https://docs.docker.com/docker-for-windows/install/) from the Docker website. It also comes with Docker-compose. You can get NodeJS and npm from the [NodeJS website](https://nodejs.org). You may also need [Python](https://www.python.org/downloads/windows/) 3.7+ and [Visual Studio](https://visualstudio.microsoft.com/downloads/) 2015 or newer with the [“Desktop development with C++” workload](https://docs.microsoft.com/en-us/cpp/build/vscpp-step-0-installation?view=msvc-160).

We recommend using the [WSL/2 backend for Docker](https://docs.docker.com/docker-for-windows/wsl/). You should use [nvm](https://github.com/creationix/nvm) to install Node inside of your default Linux distro. Once you have, you can install WP Local Docker, from inside of Linux, following the [installation instructions](#Installation).

It's useful to share git credentials between Windows and WSL/2. To do so, run the following commands inside of your default Linux distro, replacing `USER-NAME` with your Windows username:

```bash
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/libexec/git-core/git-credential-manager.exe"
cd ~/.ssh
cp /mnt/c/Users/USER-NAME/.ssh/id_rsa* .
```

#### HTTPS on Windows

If https is not working in the browsers on Windows, you will need to set up a shared root certificate. You will need [mkcert installed](https://github.com/FiloSottile/mkcert) inside your WSL2 machine. With `mkcert` installed, run the following commands:

```bash
mkcert -CAROOT
```

That will output the path to a certificate root directory which contains the `rootCA.pem` file you will need to share with Windows.
List the directory path you got from the previous command:

```bash
ls /home/<user>/.local/share/mkcert
```

If there is no such directory or the directory is empty run:

```bash
mkcert -install
```

You should see an output like this:

```bash
Created a new local CA 💥
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)! 🦊
```

If there was no root certificate initially, you will need to regenerate the certificates for all the sites:

```bash
10updocker cert generate <yourwebsite.test>
```

Now, there should be a `rootCA.pem` file in the root certificate directory. Copy the `rootCA.pem` into any directory on Windows. In the Windows PowerShell, set that directory as `CAROOT` environment variable:

```bash
$Env:CAROOT = "C:\path\to\directory\with\certificate"
```

Then install certificate in the Windows PowerShell with:

```bash
mkcert -install
```

You may need to install `mkcert` on Windows, or just use the latest executable from [the releases page](https://github.com/FiloSottile/mkcert/releases).

Remember to restart any open browsers for this change to take effect! This should fix any https issues.

### Linux

For Linux users, Docker provides platform-specific installation instructions on their [documentation site](https://docs.docker.com/install/#supported-platforms). Once Docker is installed, you will need to [manually install Docker compose](https://docs.docker.com/compose/install/). You can install NodeJS via a package manager for many Linux platforms [following these instructions](https://nodejs.org/en/download/package-manager/). To setup C compilers & add a sudo user to the Docker group, run:

```bash
sudo apt install -y gcc make
sudo usermod -a -G docker user
```

---

## Installation

Getting WP Local Docker up and running on your system involves a few simple steps. Start by ensuring that you have met all the [prerequisites](#prerequisites) for installation.

Next, you can install WP Local Docker as a global npm package. Run the following command in your terminal:

```bash
npm install -g wp-local-docker
```

To confirm that WP Local Docker has been installed successfully, you can check its version. Simply type:

```bash
10updocker --version
```

### Configuration

The first time you use a WP Local Docker command, it will use default configuration settings. These settings include storing all your environments within the `~/wp-local-docker-sites` directory and managing your hosts file when creating and deleting environments.

If you want to customise the environment path or choose not to let WP Local Docker update your hosts file, you can do so. Run the command:

```bash
10updocker configure
```

Then, follow the prompts to customise your settings.

### Updating

Keeping WP Local Docker up-to-date is important. To update it, you can run the installation command again. NPM will replace your current version with the latest one. Here's the command:

```bash
npm install -g wp-local-docker
```

---

## Using WP Local Docker

### Create an Environment

Creating an environment in WP Local Docker is as simple as answering a series of prompts. To start, run the following command in your terminal:

```bash
10updocker create
```

You'll be guided through the process of configuring your environment to fit your needs.

We recommend using the `.test` top-level domain (TLD) for your local environments. Why `.test`? This TLD is reserved for software testing and won't be installed into the global Domain Name System. Plus, WP Local Docker is set up to direct any container-to-container traffic for `.test` TLDs straight to the gateway container. This means features like WP Cron and the REST API will work between environments right out of the box.

### Start an Environment

To start a pre-existing environment, run the following command:

```bash
10updocker start <hostname>
```

Replace `<hostname>` with the hostname of the environment you want to start.

Want to start all environments at once? We've got you covered! You can use a special hostname `all` to start all environments and global services. Here's how:

```bash
10updocker start all
```

### Stop an Environment

Sometimes, you might need to stop an environment from running. Don't worry, stopping an environment won't delete any files, Docker volumes, or databases related to that environment. All you need to do is run the following command:

```bash
10updocker stop <hostname>
```

Replace `<hostname>` with the hostname of the environment you want to stop.

Just like with starting environments, you can stop all your running environments and global services at once using the special hostname `all`. Here's the command:

```bash
10updocker stop all
```

### Configure an Environment

The `config/` directory of an environment is where you can find settings for various services. Here's what you'll find inside:

- **`elasticsearch/`**
	- **`elasticsearch.yml`**
- **`nginx/`**
	- **`default.conf`**
	- **`develop.conf`**
	- **`server.conf`**
- **`php-fpm/`**
	- **`docker-php-ext-xdebug.ini`** - This is where you'd put settings typically found in a `php.ini` file, like `max_execution_time`, `memory_limit`, `xdebug.max_nesting_level`, `post_max_size`, `upload_max_filesize`, and others.
	- **`wp-cli.develop.yml`**
	- **`wp-cli.local.yml`**

Remember, after making changes to any files in the `config/` directory or to the `docker-compose.yml` file, you'll need to recreate the containers. You can find instructions on how to do this under [Restart an Environment](#restart-an-environment).

### Restart an Environment

If you need to restart all services associated with a pre-existing environment, you can easily do so with the following command:

```bash
10updocker restart <hostname>
```

Remember to replace `<hostname>` with the hostname of the environment you want to restart.

And yes, just like with starting and stopping environments, you can restart all your environments and global services at once using the special hostname `all`. Here's how:

```bash
10updocker restart all
```

### Upgrade an Environment

Keeping your environments updated with the latest features and improvements is important. With WP Local Docker, you can upgrade all services associated with a pre-existing environment using the following command:

```bash
10updocker upgrade <hostname>
```

Replace `<hostname>` with the hostname of the environment you want to upgrade.

This command will help you keep your environments updated with the most recent changes from upstream.

If you created your environment before `v2.6.0`, we recommend upgrading. You'll notice a significant performance increase.

For environments created before `v3.0.1`, the upgrade will update the Elasticsearch image. Please note that when updating the Elasticsearch image, we need to delete the Docker volume, so you'll need to reindex after running this command.

### Delete an Environment

There might be times when you need to delete an environment. To do this, run the following command:

```bash
10updocker delete <hostname>
```

Make sure to replace `<hostname>` with the hostname of the environment you want to delete.

Please be aware that this action will permanently delete the environment, along with any local files, Docker volumes, and databases related to it.

If you need to delete all environments, you can use the special hostname `all`. When you do this, you'll be asked to confirm the deletion of each environment:

```bash
10updocker delete all
```

Remember, deletion is permanent. So make sure you have everything backed up or moved before you delete an environment.

## Advanced Usage

### Managing Certificates

Working with SSL on your local environments? WP Local Docker has got you covered. Here's how you can manage your SSL certificates:

To generate certificates for a specific environment, use the following command:

```bash
10updocker cert generate <hostname>
```

Replace `<hostname>` with the hostname of the environment you want to generate a certificate for.

If you need to install a new certificate authority in the system trust store, you can do so with this command:

```bash
10updocker cert install
```

Just follow the prompts, and you'll have your certificates managed in no time.

### Elasticsearch

If you've enabled Elasticsearch for an environment, you can easily send requests from your host machine to the Elasticsearch server. How do you do this? Simply prefix the URL path with `/__elasticsearch/`.

For example, if you wanted to access the `/_all/_search/` endpoint of Elasticsearch, the URL would look like this:

```bash
http://<hostname>/__elasticsearch/_all/_search
```

Don't forget to replace `<hostname>` with the hostname of your environment.

When configuring the ElasticPress settings, enter `http://<hostname>/__elasticsearch` as the Elasticsearch host.

### Running WP CLI Commands

Running WP CLI commands against an environment is a breeze with WP Local Docker. Here's how you do it:

First, navigate to your environment directory. By default, this would be somewhere within `~/wp-local-docker-sites/<environment>/`. Replace `<environment>` with the name of your environment.

Once you're inside the environment directory, you can run WP CLI commands using the following syntax:

```bash
10updocker wp <command>
```

Replace `<command>` with any valid command you would usually pass directly to WP CLI.

Let's look at a couple of examples:

- To replace all instances of 'mysite.com' with 'mysite.test' in your database, run:

```bash
10updocker wp search-replace 'mysite.com' 'mysite.test'
```

- To list all sites in a multisite installation, use:

```bash
10updocker wp site list
```

And that's it! You can now run any WP CLI command against your WP Local Docker environment.

### Getting a Shell Inside a Container

Did you know that you can get a shell inside any container in your environment? It's easy with WP Local Docker. Just use the following command:

```bash
10updocker shell [<service>]
```

Replace `<service>` with the name of the service whose container you want to access. If you don't specify a service, WP Local Docker will use the `phpfpm` container by default.

The available services can vary depending on the options you selected when creating the environment. However, they may include:

- `phpfpm`
- `nginx`
- `elasticsearch`
- `memcached`

This feature gives you a powerful tool for managing and troubleshooting your environments.

### Accessing Container Logs

Keeping an eye on your container logs is a crucial part of managing your environments. With WP Local Docker, you can easily access real-time logs using the following command:

```bash
10updocker logs [<service>]
```

Replace `<service>` with the name of the service whose logs you want to view. If you don't specify a service, WP Local Docker will show logs from all containers in the current environment.

To stop viewing the logs, just press `ctrl+c`.

The available services can vary depending on the options you selected when creating the environment. However, they may include:

- `phpfpm`
- `nginx`
- `elasticsearch`
- `memcached`

With this command, you can keep track of what's happening in your environments at any given moment.

### Clearing Shared Cache

Cache helps speed up operations and save bandwidth for WP CLI, Snapshots, and npm (when building the development version of WordPress). But there might be times when you need to clear it.

To clear the WP CLI, WP Snapshots, and npm caches, simply run the following command:

```bash
10updocker cache clear
```

This command will help keep your environments running smoothly and efficiently.

### Updating Docker Images

Keeping your Docker images updated is essential for optimal performance and security. To update the Docker images used by WP Local Docker to the latest available version, use the following command:

```bash
10updocker image update
```

This command will check which Docker images are present on your system and update them as needed.

### Stopping Global Services

WP Local Docker uses a suite of global services to function properly. If you need to turn off these services, you can use the following command:

```bash
10updocker stop all
```

This command will stop all running environments followed by the global services.

---

## Tools

### phpMyAdmin

[phpMyAdmin](https://www.phpmyadmin.net/) is included in the global services stack deployed to support all environments.

You can access phpMyAdmin by navigating to [http://localhost:8092](http://localhost:8092).

Use the following credentials to log in:

* Username: `wordpress`
* Password: `password`

### MailCatcher

[MailCatcher](https://mailcatcher.me/) is included in the global services stack deployed to support all environments. It's preconfigured to catch mail sent from any of the environments created by WP Local Docker.

You can access MailCatcher by navigating to [http://localhost:1080](http://localhost:1080).

### Xdebug version 3

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

```ini
xdebug.client_host = host.docker.internal
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

* Set the port to `9003`
* Check (Ignore external connections through unregistered server configurations) to avoid wait on non wanted files.
* Check (Resolve breakpoint if it's not available on the current line)
* Uncheck (Force break at first line when no path mapping specified)
* Uncheck (Force break at frist line when a script is outside the project)

Go to `Settings > PHP > Servers`.

* Add a new server with the following settings:
	* `name: yourdomain.com`
	* `host: localhost`
	* `port: 80`
	* `debugger: Xdebug`
	* Enable `Use path mappings (select if the server is remote or symlinks are used)`
	* Within the map directory select the path you want to debug (usually `wp-content`) and map it to `/var/www/html/wp-content`

* Save your settings
* Start to listen for connections on the top bar of your IDE (red phone icon)

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

### Xdebug version 2

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

### Snapshots

Starting from version 4.0.0, WP Local Docker has switched from the old [WP Snapshots](https://github.com/10up/wpsnapshots) system to the new [Snapshots](https://github.com/10up/snapshots) WP-CLI command. Although the public API and configuration have remained the same, the new system is more robust and allows for easier future feature additions.

#### Configuration

If you haven't used [Snapshots](https://github.com/10up/snapshots) with [WP Local Docker](https://github.com/10up/wp-local-docker-v2) yet, you'll first need to configure Snapshots with your AWS credentials. To do so, run the following command:

```
10updocker wp snapshots configure <repository>
```

Replace `<repository>` with your repository name (for example, `10updocker wp snapshots configure 10up`). You'll then be prompted to enter your AWS credentials and a few other configuration details. Once completed, the configuration will be available across all of your WP Local Docker environments.

#### Pulling an Environment

To pull an existing snapshot from the repository into your current environment (replacing your database and wp-content), use the following command:

```
10updocker wp snapshots pull <snapshot-id>
```

Replace `<snapshot-id>` with the ID of the snapshot you want to pull. Make sure to run this command from within your environment directory (by default, this is somewhere within `~/wp-local-docker-sites/<environment>/`).

#### Searching for an Environment

To search the repository for snapshots, use the following command:

```
10updocker wp snapshots search <search-term>
```

Replace `<search-term>` with the term you want to search for. The search term will be compared against project names and authors. If you search for "*", the command will return all snapshots.

#### Other Commands

The general form for all Snapshots commands is as follows:

```
10updocker wp snapshots <command>
```

Replace `<command>` with any command that Snapshots accepts. The command is passed directly to Snapshots, so it will work with any Snapshots command. Note that any command requiring a WordPress environment (like pull, create, etc.) needs to be run from within an environment directory (by default, this is somewhere within `~/wp-local-docker-sites/<environment>/`).

---

## F.A.Q

### Can I run as many concurrent enviroments as I want?

Concurrent environments are limited by the available resources of your host machine.

### I am having issues with wp-local-docker, what are the best troubleshooting techniques?

See the [Troubleshooting](#troubleshooting) section.

### How to ignore `node_modules/` in your container?

One of the primary performance bottlenecks with Docker for Mac is file syncing between the host machine and the Docker containers. The less files that are mounted into the Docker container volumes, the less work Docker needs to do ensuring those files are synced. NPM and the /node_modules/ directories are the worst offenders by far. Since assets are transpiled/compiled from source prior to being used on the frontend, the dependencies in `node_modules/` are not actually required to run the site locally, only the compiled dist files.

In order to mitigate the additional pressure `node_modules/` puts on Docker filesystem syncing, we can instruct Docker to ignore directories when mounting volumes. Technically, we are instructing Docker to mount nothing to a specific path on the volume, but the effect is the same. See below for a practical example of how one might edit the `docker-compose.yml` file in the site root:

```yaml
nginx:
    # ...
    volumes:
        - './wordpress:/var/www/html:cached'
        - '/var/www/html/wp-content/themes/{my-theme}/node_modules'
        - '/var/www/html/wp-content/plugins/{my-plugin}/node_modules'
phpfpm:
    # ...
    volumes:
        - './wordpress:/var/www/html:cached'
        - '/var/www/html/wp-content/themes/{my-theme}/node_modules'
        - '/var/www/html/wp-content/plugins/{my-plugin}/node_modules'
```

Note: This action cannot be performed automatically as the specific paths to `node_modules/` cannot be determined. You will need to manually determine the path where `node_modules/` will be mounted onto the volume.

Once you have made the appropriate changes in your `docker-compose.yml` file, you must stop and start for the changes to take effect and confirm things have worked.

### How do I upgrade an environment to a new version of PHP?

To upgrade to a newer version of PHP, please edit the `docker-compose.yml` file in the environment you are updating.
From:

```yaml
  phpfpm:
    image: '10up/wp-php-fpm-dev:5.6-ubuntu'
    # ...
    volumes:
      - './wordpress:/var/www/html:cached'
      - './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/5.6/fpm/docker-php-ext-xdebug.ini:cached'
```

To:

```yaml
  phpfpm:
    image: '10up/wp-php-fpm-dev:7.4-ubuntu'
    # ...
    volumes:
      - './wordpress:/var/www/html:cached'
      - './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/7.4/fpm/docker-php-ext-xdebug.ini:cached'
```

Once you update this run `docker-compose down` and `docker-compose up` to rebuild the containers.

### What if I want to modify the default ports for global services?

While you could modify the port configuration globally or per project, _this will require making adjustments in other areas_ to prevent a permissions error when starting up the database, such as:

```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost' (using password: YES)
```

For best results we recommend using the default port configuration whenever possible.

### How do I expose my environment to the internet?

```
ngrok http -host-header=10up.test 80
```

### Support for the M1 Architecture

For existing sites, if you wish to utilize the new M1 architecture optimized Docker images, you'll need to edit the `docker-compose.yml` file to match a newly created one.

Alternatively, if you create new sites, they will be optimized for M1 architecture by default.

---

## Troubleshooting

Facing issues with WP Local Docker? Here are a few steps you can follow to troubleshoot:

1. Update Docker and Node: First, make sure that Docker and Node are up to date.

2. Update wp-local-docker: Ensure that wp-local-docker is up to date as well. You can do this by running the following command:

```
npm i -g wp-local-docker
```

3. Restart Docker: Once everything is up to date, it's generally a good idea to restart Docker.

4. Update Docker images: Make sure you are using the latest Docker images by running the following command:

```
10updocker image update
```

5. Reset global services configuration: Run the following command and answer `Yes` to the prompt `Do you want to reset your global services configuration? This will reset any customizations you have made.`:

```
10updocker configure
```

6. Reset specific instance: Finally, if you're having issues with a specific instance, you can reset it by running the following command:

```
10updocker upgrade
```

This will replace the `docker-compose.yml` file for that particular site instance.

Remember, troubleshooting is a process of elimination. Try these steps one by one to identify and resolve the issue.



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



### I've upgraded WP Local Docker from a previous version and now the wpsnapshots command isn't working

This is likely to do with the change from the [WP Snapshots](https://github.com/10up/wpsnapshots) system, to the new [Snapshots](https://github.com/10up/snapshots) WP-CLI command.
This update removed the need for a dedicated container for the snapshots system, and instead uses the `phpfpm` container.
Because of this, we need to ensure that the `phpfpm` container has access to the `~/.wpsnapshots` and `~/.aws` directories on your host machine.

To provide that access, please edit the `docker-compose.yml` file in the environment you are updating, to add the following lines:

```yaml
  phpfpm:
      image: '10up/wp-php-fpm-dev:7.4-ubuntu'
      # ...
      volumes:
         # ...
          - '~/.wpsnapshots:/home/www-data/.wpsnapshots:cached'
          - '~/.aws:/home/www-data/.aws:cached,ro'
```

You'll then need to stop and start the environment for the changes to take effect.

If that doesn't resolve the issues, try updating your Docker images using `10updocker image update`, it could be that you have older images that don't yet have the Snapshots WP-CLI tool installed.

---

## Migrating from Older Versions

### Migrate a WP Local Docker V1 Environment

Migrating an old standalone WP Local Docker environment to a new WP Local Docker V2 environment is straightforward. First, create a new environment using the `10updocker create` command. Then, use the following command to perform the migration:

```
10updocker migrate <OLD_PATH> [NEW_ENV]
```

Here, `<OLD_PATH>` should be the path to the root of your old WP Local Docker environment.

`[NEW_ENV]` should specify the environment to import into. If you omit this, you will be prompted to select from available environments.

Here's an example:

```
10updocker migrate ~/sites/mysite
```

This command will migrate the environment located at `~/sites/mysite` to a new WP Local Docker V2 environment.

### Migrate a WP Local Docker V2 Environment to v3.0.0+

To upgrade your WP Local Docker V2 environment to V3, run the following command:

```
10updocker configure
```

When asked `Do you want to reset your global services configuration? This will reset any customizations you have made.`, answer `yes`.

This will update your configuration to the latest `.wplocaldocker/global/docker-compose.yml`.

### Migrate a WP Local Docker V2 Environment to v4.0.0+

To upgrade your WP Local Docker V2 environment to V4, follow the steps below:

1. Update Docker images:

   ```bash
   10updocker image update
   ```

2. Update WP Local Docker

   ```bash
   npm install -g wp-local-docker@latest
   ```

3. Restart your terminal

4. Verify the version:

   ```bash
   10updocker -v
   ```

   This should return a `4.x.x` version.

5. Update the `docker-compose.yml` files for your environments to grant access to the `~/.aws` and `~/.wpsnapshots` directories

   ```yaml
   phpfpm:
         image: '10up/wp-php-fpm-dev:7.4-ubuntu'
         # ...
         volumes:
            # ...
             - '~/.wpsnapshots:/home/www-data/.wpsnapshots:cached'
             - '~/.aws:/home/www-data/.aws:cached,ro'
   ```

6. Restart your environment

   ```bash
   10updocker restart <hostname>
   ```

7. Ensure Snapshots is functioning and has access to the data:

   ```bash
   10updocker wp snapshots search test
   ```

This will complete the migration process from WP Local Docker V3 to V4.


---

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.

#### Like what you see?

<a href="https://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850"></a>
