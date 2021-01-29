# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## [Unreleased] - TBD

- 

## [2.8.1] - 2021-01-29

### Changed
- Compose files have been updated to build PHP images in the `.containers` context.

### Fixed
- Fixed unexpected behaviour caused by errors thrown from the `execSync` command when a subcommand exited with non-zero exit code.

## [2.8.0] - 2021-01-26
### Added
- Adds `clone` command to clone git repositories and create new environments for it.
- Adds `completion <shell>` command to display instructions how to activate autocomplete for a specific shell. Supported shells : `bash` and `zsh`.
- Adds the ability to use project specific configuration files. It is read during clonning process and allows to define a configuration required for the project and allows to omit setup questions. If the configuration is not sufficient (for example, it misses php version), then appropriate questions will be asked fill gaps.
- Adds `init` command to generate project configuration files.
- Adds the ability to update a docker-compose config for an environment if the configuration file contains `dockerCompose` callback function.
- Adds global `--env=<environment>` option to specify an environment to use and to skip environment selection prompt.
- Adds global `--verbose` option to switch between quite and verbose output modes.
- Adds `--tail=<number>` argument to the `logs` command to limit the number of lines to show from the end of the logs for each container. It works the same way as it works for `docker-compose logs` itself and has `all` as default.
- Adds `--pull` option to the `start` command to automatically pull latest images before an environment starts.
- Adds `--remove-built-images` flag to the `image update` command to force removal of built images.
- Adds `--yes` flag to the `image update` command to suppress questions.
- Adds `<cmd>` positional argument to the `shell` command to override command to run in the container. By default it is still `bash` but now it is possible to run different single commands without launching bash first.
- Adds `list` and `ls` commands to list all the environments and meta information.
- Adds engines information to the package.json to strictly denote that Node v12+ is required.
- Adds `cert install` command to install a new local CA in the system trust store.
- Adds `cert generate <domains..>` command to generate self-signed SSL certificates for certain domains.
- Auto-completion script for `10updocker` and `10updocker-hosts` commands (props [eugene-manuilov](https://github.com/eugene-manuilov) via [#105](https://github.com/10up/wp-local-docker-v2/pull/105))
- Adds `SYS_PTRACE` capability to the php service to support [`strace`](https://linux.die.net/man/1/strace) command.

### Changed
- Reworks all commands to use `yargs` cli framework.
- Updates the way how `wp` and `wpsnapshots` commands determine subcommand arguments that needs to be passed into containers. Previously, wp-local-docker passed all arguments to the underlying command even if some arguments weren't intended for it. Now it passes everything that comes after the command keyword only, for example: `10updocker --env=my-site-test wp plugin install hello-dolly --version=1.7.2` runs `wp plugin install hello-dolly --version=1.7.2` command in the container of the `my-site-test` environment and doesn't pass `--env=my-site-test` argument itself.
- Removes https question and updates `create` command to create sites with HTTPS only.
- Updates bash completion script to support new commands and aliases.
- `ini` comments to use semi-colon for compatibility (props [@aaemnnosttv](https://github.com/aaemnnosttv) via [#113](https://github.com/10up/wp-local-docker-v2/pull/113))
- Documentation updates (props [@jeffpaul](https://github.com/jeffpaul) via [#58](https://github.com/10up/wp-local-docker-v2/pull/58))
- Updates `ENABLE_XDEBUG` environment variable in the docker-compose config to be `'true'` by default.
- Updates the `10up/wpsnapshots` image to use the `2` tag.

### Fixed
- Fixes issues with hosts manipulations during environment creations and deletions when node.js executable is not in the root's PATH.
- Fixes issues in the development version caused by memcacheadmin section in the development config for nginx.
- Issue with project directory recognition (props [@eugene-manuilov](https://github.com/eugene-manuilov), [@jamesmorrison](https://github.com/jamesmorrison) via [#110](https://github.com/10up/wp-local-docker-v2/pull/110))

### Security
- Bump `acorn` from 7.1.0 to 7.2.0 (props [@dependabot](https://github.com/apps/dependabot) via [#119](https://github.com/10up/wp-local-docker-v2/pull/119))
- Bump `lodash` from 4.17.15 to 4.17.19 (props [@dependabot](https://github.com/apps/dependabot) via [#127](https://github.com/10up/wp-local-docker-v2/pull/127))

## [2.7.0] - 2020-03-12
### Added
- Optionally use HTTPS by default when creating a new environment. (props [@eugene-manuilov](https://github.com/eugene-manuilov))

### Changed
- Relocated global configuration directory to ~/.wplocaldocker. This allows you to override configuration options for global services like MySQL while also resolving a common issue on Mac and Windows with shared directories. Simply edit the docker-compose.yml file located in the ~/.wplocaldocker/global directory. (props [@dustinrue](https://github.com/dustinrue))

### Removed
- Removes all current themes when you select “remove default content” during environment creation (props [@mmcachran](https://github.com/mmcachran))

### Fixed
- Other bug fixes and internal project items (props [@eugene-manuilov](https://github.com/eugene-manuilov), [@dustinrue](https://github.com/dustinrue), [@christianc1](https://github.com/christianc1), [@tylercherpak](https://github.com/tylercherpak), [@jeffpaul](https://github.com/jeffpaul))

### Security
- More secure by default by forcing global services to listen only on localhost. This can be overridden by editing the global docker-compose.yml file mentioned above. (props [@dustinrue](https://github.com/dustinrue), [@fariasf](https://github.com/fariasf))

## [2.6.2] - 2019-12-19
### Fixed
- Hotfixes an issue preventing users on Mac and Windows from upgrading

## [2.6.1] - 2019-12-19
### Fixed
- Fixes issue with upgrading environments on Linux

## [2.6.0] - 2019-12-18
### Added
- All new containers based on CentOS 7 for PHP 5.6 through 7.1 and CentOS 8 for PHP 7.2 through 7.4
- Adds support for PHP 7.4.
- Enable/Disable Xdebug using ENV var in the docker-compose.yml file. Disabling Xdebug improves performance significantly on some systems.
- Additional tools installed including git, composer, telnet, nc and more.
opcache configured with optimal settings for development.

### Changed
- php-fpm now runs as www-data on macOS and Windows hosts or as the user who created the project on Linux. This is to ensure permissions are correct.
- Upgrade to Elasticsearch 5.6.16.
- Limit MySQL to 1GB of memory, configure for 1GB memory limit.
- Limit Elasticsearch to 1GB of memory, configure for 1GB of memory.
- Improved image update handling.

### Fixed
- Resolves shell escaping issues (via [#60](https://github.com/10up/wp-local-docker-v2/pull/60))
- Resolves issues pulling the phpmemcachedadmin utility (via [#63](https://github.com/10up/wp-local-docker-v2/pull/63))

## [2.5.1] - 2019-09-05
### Added
- Log php errors to the docker logs

### Changed
- Updates npm dependencies

## [2.5.0] - 2019-07-02
### Added
- Adds WP CLI configuration file that allows running commands directly from the host with the `wp` command.

## [2.4.3] - 2019-03-12
### Fixed
- Resolves issues creating a WP Snapshot repository via WP Local Docker

## [2.4.2] - 2019-02-25
### Fixed
- Fixes a bug with the new `upgrade` command that causes an error if elasticsearch was not in the environment to be updated

## [2.4.1] - 2019-02-25
- No changes from 2.4.0. Working around npm publish issue.

## [2.4.0] - 2019-02-25
### Added
- Adds new `upgrade` command to upgrade an environment to the latest docker-compose configuration. Current just adds the `:cached` flag on volumes for any preexisting environment

### Changed
- Updates volumes to use `:cached` flag to improve performance, particular on MacOS

### Fixed
- Resolves issue parsing environment from working directory when there are capitalization discrepancies (via [#21](https://github.com/10up/wp-local-docker-v2/issues/21))

## [2.3.0] - 2019-02-22
### Added
- Adds prompt for proxying images from another site. Props @TylerB24890

### Changed
- Updates lodash to latest version to fix vulnerability in the package

## [2.2.0] - 2019-02-04

[Unreleased]: https://github.com/10up/wp-local-docker-v2/compare/master...develop
[2.8.1]: https://github.com/10up/wp-local-docker-v2/compare/2.8.0...2.8.1
[2.8.0]: https://github.com/10up/wp-local-docker-v2/compare/2.7.0...2.8.0
[2.7.0]: https://github.com/10up/wp-local-docker-v2/compare/2.6.2...2.7.0
[2.6.2]: https://github.com/10up/wp-local-docker-v2/compare/2.6.1...2.6.2
[2.6.1]: https://github.com/10up/wp-local-docker-v2/compare/2.6.0...2.6.1
[2.6.0]: https://github.com/10up/wp-local-docker-v2/compare/2.5.1...2.6.0
[2.5.1]: https://github.com/10up/wp-local-docker-v2/compare/2.5.0...2.5.1
[2.5.0]: https://github.com/10up/wp-local-docker-v2/compare/2.4.3...2.5.0
[2.4.3]: https://github.com/10up/wp-local-docker-v2/compare/2.4.2...2.4.3
[2.4.2]: https://github.com/10up/wp-local-docker-v2/compare/2.4.1...2.4.2
[2.4.1]: https://github.com/10up/wp-local-docker-v2/compare/2.4.0...2.4.1
[2.4.0]: https://github.com/10up/wp-local-docker-v2/compare/2.3.0...2.4.0
[2.3.0]: https://github.com/10up/wp-local-docker-v2/compare/2.2.0...2.3.0
[2.2.0]: https://github.com/10up/wp-local-docker-v2/releases/tag/2.2.0
