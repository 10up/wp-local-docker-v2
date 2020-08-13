const { platform } = require( 'os' );

const { cacheVolume } = require( '../../env-utils' );
const { images } = require( '../../docker-images' );

module.exports = function makeDockerCompose( spinner ) {
	return async ( envSlug, hosts, settings, certs ) => {
		spinner.start( 'Creating docker-compose configuration...' );

		const {
			php: phpVersion,
			wordpress,
			elasticsearch,
		} = settings;

		const { type: wordpressType } = wordpress || {};
		const allHosts = [ ...hosts, ...hosts.map( ( host ) => `*.${ host }` ) ];

		const baseConfig = {
			// use version 2 so we can use limits
			version: '2.2',
			services: {
				memcached: {
					image: images['memcached'],
				},
				nginx: {
					image: images['nginx'],
					expose: [ '80', '443' ],
					depends_on: [ 'phpfpm' ],
					networks: [ 'default', 'wplocaldocker' ],
					volumes: [ './wordpress:/var/www/html:cached' ],
					environment: {
						CERT_NAME: certs ? envSlug : 'localhost',
						HTTPS_METHOD: 'noredirect',
						VIRTUAL_HOST: allHosts.join( ',' ),
					},
				},
				phpfpm: {
					image: images[`php${ phpVersion }`],
					depends_on: [ 'memcached' ],
					networks: [ 'default', 'wplocaldocker' ],
					dns: [ '10.0.0.2' ],
					volumes: [
						'./wordpress:/var/www/html:cached',
						'./config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/docker-php-ext-xdebug.ini:cached',
						`${ cacheVolume }:/var/www/.wp-cli/cache:cached`,
					],
					environment: {
						ENABLE_XDEBUG: 'false'
					},
				},
			},
			networks: {
				wplocaldocker: {
					external: {
						name: 'wplocaldocker',
					},
				},
			},
			volumes: {
				[ cacheVolume ]: {
					external: {
						name: cacheVolume,
					},
				},
			},
		};

		// Unlike Mac and Windows, Docker is a first class citizen on Linux
		// and doesn't have any kind of translation layer between users and the
		// file system. Because of this the phpfpm container will be running as the 
		// wrong user. Here we setup the docker-compose.yml file to rebuild the
		// phpfpm container so that it runs as the user who created the project.
		if ( platform() == 'linux' ) {
			baseConfig.services.phpfpm.image = `wp-php-fpm-dev-${ phpVersion }-${ process.env.USER }`;
			baseConfig.services.phpfpm.volumes.push( `~/.ssh:/home/${ process.env.USER }/.ssh:cached` );
			baseConfig.services.phpfpm.build = {
				dockerfile: '.containers/php-fpm',
				context: '.',
				args: {
					PHP_IMAGE: images[`php${ phpVersion }`],
					CALLING_USER: process.env.USER,
					CALLING_UID: process.getuid()
				}
			};
		} else {
			// the official containers for this project will have a www-data user. 
			baseConfig.services.phpfpm.volumes.push( '~/.ssh:/home/www-data/.ssh:cached' );
		}

		let nginxConfig = 'default.conf';
		if ( wordpressType == 'dev' ) {
			nginxConfig = 'develop.conf';
			baseConfig.services.phpfpm.volumes.push( './config/php-fpm/wp-cli.develop.yml:/var/www/.wp-cli/config.yml:cached' );
		} else {
			baseConfig.services.phpfpm.volumes.push( './config/php-fpm/wp-cli.local.yml:/var/www/.wp-cli/config.yml:cached' );
		}

		// Map the nginx configuraiton file
		baseConfig.services.nginx.volumes.push( `./config/nginx/${  nginxConfig  }:/etc/nginx/conf.d/default.conf:cached` );

		if ( elasticsearch ) {
			baseConfig.services.phpfpm.depends_on.push( 'elasticsearch' );

			baseConfig.services.elasticsearch = {
				image: images['elasticsearch'],
				expose: [ '9200' ],
				mem_limit: '1024M',
				mem_reservation: '1024M',
				volumes: [
					'./config/elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:cached',
					'./config/elasticsearch/plugins:/usr/share/elasticsearch/plugins:cached',
					'elasticsearchData:/usr/share/elasticsearch/data:delegated',
				],
				environment: {
					ES_JAVA_OPTS: '-Xms450m -Xmx450m',
				},
			};

			// @ts-ignore
			baseConfig.volumes.elasticsearchData = {};
		}

		let dockerComposeConfig = { ...baseConfig };
		if ( typeof settings.dockerCompose === 'function' ) {
			const filteredConfig = await settings.dockerCompose.call( settings, baseConfig, { spinner } );
			if ( filteredConfig ) {
				dockerComposeConfig = { ...filteredConfig };
			}
		}

		spinner.succeed( 'Docker-compose configuration is created...' );

		return dockerComposeConfig;
	};
};
