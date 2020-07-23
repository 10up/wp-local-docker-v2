# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## [2.8.0] - TBD

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

[Unreleased]: https://github.com/10up/wp-local-docker-v2/compare/2.7.0...master
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

