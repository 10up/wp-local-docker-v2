const path = require( 'path' );
const os = require( 'os' );

const fsExtra = require( 'fs-extra' );
const chalk = require( 'chalk' );

const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const { readYaml, writeYaml } = require( '../utils/yaml' );
const envUtils = require( '../env-utils' );
const { images } = require( '../docker-images' );
const { stop, start } = require( '../environment' );

exports.command = 'upgrade [<env>]';
exports.desc = 'Upgrades environment to the latest version.';

exports.builder = function( yargs ) {
	yargs.positional( 'env', {
		type: 'string',
		describe: 'Optional. Environment name.',
	} );
};

exports.handler = makeCommand( { checkDocker: false }, async ( { verbose, env } ) => {
	const spinner = ! verbose ? makeSpinner() : undefined;
	const envName = await envUtils.resolveEnvironment( env || '' );
	const envPath = await envUtils.getPathOrError( envName, spinner );
	const envSlug = envUtils.envSlug( envName );

	await stop( envSlug, spinner );

	// Create a backup of the old yaml.
	const dockerCompose = path.join( envPath, 'docker-compose.yml' );
	const yaml = readYaml( dockerCompose );

	try {
		const dockerComposeBak = `${ dockerCompose }.bak`;
		await writeYaml( dockerComposeBak, yaml );
		if ( spinner ) {
			spinner.info( `Backup is created: ${ chalk.cyan( dockerComposeBak ) }` );
		} else {
			console.log( `Created backup of previous configuration ${ envSlug }` );
		}
	} catch ( err ) {
		if ( spinner ) {
			throw err;
		} else {
			console.log( err );
		}
	}

	// Set docker-compose version.
	yaml.version = '2.2';

	// Upgrade image.
	const phpVersion = yaml.services.phpfpm.image.split( ':' ).pop();
	if ( phpVersion ) {
		if ( phpVersion === '5.5' ) {
			if ( spinner ) {
				spinner.warn( 'Support for PHP v5.5 was removed in the latest version of WP Local Docker.' );
				throw new Error( 'This environment cannot be upgraded. No changes were made.' );
			} else {
				console.warn( 'Support for PHP v5.5 was removed in the latest version of WP Local Docker.' );
				console.error( 'This environment cannot be upgraded. No changes were made.' );
				process.exit( 1 );
			}
		}
	}

	const phpImage = images[`php${ phpVersion }`];
	if ( phpImage ) {
		yaml.services.phpfpm.image = phpImage;
	}

	// Update defined services to have all cached volumes
	[ 'nginx', 'phpfpm', 'elasticsearch' ].forEach( ( service ) => {
		if ( yaml.services[ service ] && Array.isArray( yaml.services[ service ].volumes ) ) {
			yaml.services[ service ].volumes.forEach( ( volume, index ) => {
				const parts = volume.split( ':' );
				if ( parts.length === 2 ) {
					parts.push( 'cached' );
					yaml.services[ service ].volumes[ index ] = parts.join( ':' );
				}
			} );
		}
	} );

	// Upgrade volume mounts.
	const deprecatedVolumes = [
		'./config/php-fpm/php.ini:/usr/local/etc/php/php.ini:cached',
		'./config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini:cached',
		'~/.ssh:/root/.ssh:cached',
		'~/.ssh:/home/www-data/.ssh:cached',
		`~/.ssh:/home/${ process.env.USER }/.ssh:cached` // For Linux compatibility
	];

	const volumes = [ ...yaml.services.phpfpm.volumes ];
	yaml.services.phpfpm.volumes = volumes.reduce( ( acc, curr ) => {
		if ( deprecatedVolumes.includes( curr ) ) {
			// Replace xdebug config volume to be mounted to the new location.
			if ( curr === './config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini:cached' ) {
				acc.push( './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/docker-php-ext-xdebug.ini:cached' );
			}
		} else {
			acc.push( curr );
		}

		return acc;
	}, [] );

	// Update environmental variables.
	yaml.services.phpfpm.environment = yaml.services.phpfpm.environment || {};
	yaml.services.phpfpm.environment.ENABLE_XDEBUG = yaml.services.phpfpm.environment.ENABLE_XDEBUG || 'true';
	yaml.services.phpfpm.environment.PHP_IDE_CONFIG = yaml.services.phpfpm.environment.PHP_IDE_CONFIG || `serverName=${ envSlug }`;

	// Add appropriate capabilities to php container
	if ( ! Array.isArray( yaml.services.phpfpm.cap_add ) ) {
		yaml.services.phpfpm.cap_add = [];
	}
	if ( ! yaml.services.phpfpm.cap_add.includes( 'SYS_PTRACE' ) ) {
		yaml.services.phpfpm.cap_add.push( 'SYS_PTRACE' );
	}

	// Unlike Mac and Windows, Docker is a first class citizen on Linux
	// and doesn't have any kind of translation layer between users and the
	// file system. Because of this the phpfpm container will be running as the
	// wrong user. Here we setup the docker-compose.yml file to rebuild the
	// phpfpm container so that it runs as the user who created the project.
	if ( os.platform() == 'linux' ) {
		if ( phpVersion && phpImage ) {
			yaml.services.phpfpm.image = `wp-php-fpm-dev-${ phpVersion }-${ process.env.USER }`;
			yaml.services.phpfpm.build = {
				dockerfile: 'php-fpm',
				context: '.containers',
				args: {
					PHP_IMAGE: images[`php${ phpVersion }`],
					CALLING_USER: process.env.USER,
					CALLING_UID: process.getuid(),
				},
			};
		}

		yaml.services.phpfpm.volumes.push( `~/.ssh:/home/${ process.env.USER }/.ssh:cached` );
	} else {
		// the official containers for this project will have a www-data user.
		yaml.services.phpfpm.volumes.push( '~/.ssh:/home/www-data/.ssh:cached' );
	}

	// Remove legacy memcacheAdmin image
	delete yaml.services.memcacheadmin;
	if ( yaml.services.nginx && Array.isArray( yaml.services.nginx['depends_on'] ) ) {
		yaml.services.nginx['depends_on'] = yaml.services.nginx.depends_on.filter( ( service ) => service !== 'memcacheadmin' );
	}

	if ( ! spinner ) {
		console.log( 'Copying required files...' );
	}

	await fsExtra.ensureDir( path.join( envPath, '.containers' ) );
	await fsExtra.copy( path.join( envUtils.srcPath, 'containers' ), path.join( envPath, '.containers' ) );

	try {
		await writeYaml( dockerCompose, yaml );
		if ( spinner ) {
			spinner.succeed( `${ chalk.cyan( envSlug ) } is upgraded to the latest version of WP Local Docker` );
		} else {
			console.log( `${ envSlug } is upgraded to the latest version of WP Local Docker...` );
		}
	} catch ( err ) {
		console.error( err );
	}

	await start( envSlug, spinner );
} );
