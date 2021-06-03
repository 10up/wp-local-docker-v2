const { join } = require( 'path' );

const envUtils = require( '../../env-utils' );
const compose = require( '../../utils/docker-compose' );
const { makeClone } = require( '../../utils/git' );

async function downloadWordPress( wordpressType, cwd, spinner, chalk ) {
	if ( spinner ) {
		spinner.start( 'Downloading WordPress...' );
	} else {
		console.log( 'Downloading WordPress:' );
	}

	if ( wordpressType === 'dev' ) {
		const clone = makeClone( spinner, `Cloning ${ chalk.cyan( 'git://develop.git.wordpress.org/' ) }` );
		await clone( join( cwd, 'wordpress' ), 'git://develop.git.wordpress.org/' );

		if ( spinner ) {
			spinner.succeed( 'Development version of WordPress is downloaded...' );
		} else {
			console.log( ' - Done' );
		}
	} else {
		await compose.exec( 'phpfpm', 'wp core download --version=latest --force', { cwd, log: ! spinner } );

		if ( spinner ) {
			spinner.succeed( 'WordPress is downloaded...' );
		} else {
			console.log( ' - Done' );
		}
	}
}

async function configure( envSlug, cwd, spinner ) {
	const command = `wp config create --force --dbname=${ envSlug } --dbuser=wordpress --dbpass=password --dbhost=mysql`;

	if ( spinner ) {
		spinner.start( 'Configuring WordPress...' );
	} else {
		console.log( 'Create WordPress config:' );
	}

	await compose.exec( 'phpfpm', command, { cwd, log: ! spinner } );

	if ( spinner ) {
		spinner.succeed( 'WordPress config is created...' );
	} else {
		console.log( ' - Done' );
	}
}

async function install( hostname, wordpress, certs, cwd, spinner ) {
	const {
		title,
		username,
		password,
		email,
		type,
	} = wordpress;

	const command = [ 'wp', 'core' ];
	switch ( type ) {
		case 'single':
		case 'dev':
			command.push( 'install' );
			break;
		case 'subdirectory':
			command.push( 'multisite-install' );
			break;
		case 'subdomain':
			command.push( 'multisite-install' );
			command.push( '--subdomains' );
			break;
		default:
			throw Error( 'Invalid Installation Type' );
	}

	const http = certs ? 'https' : 'http';

	command.push( `--url=${ http }://${ hostname }` );
	command.push( `--title=${ title }` );
	command.push( `--admin_user=${ username }` );
	command.push( `--admin_password=${ password }` );
	command.push( `--admin_email=${ email }` );

	if ( spinner ) {
		spinner.start( 'Installing WordPress...' );
	} else {
		console.log( 'Install WordPress:' );
	}

	await compose.exec( 'phpfpm', command, { cwd, log: ! spinner } );

	if ( spinner ) {
		spinner.succeed( 'WordPress is installed...' );
	} else {
		console.log( ' - Done' );
	}
}

async function setRewrites( cwd, spinner ) {
	if ( spinner ) {
		spinner.start( 'Setting rewrite rules structure to /%postname%/...' );
	} else {
		console.log( 'Update rewrite rules:' );
	}

	await compose.exec( 'phpfpm', 'wp rewrite structure /%postname%/', { cwd, log: ! spinner } );

	if ( spinner ) {
		spinner.succeed( 'Rewrite rules structure is updated to /%postname%/...' );
	} else {
		console.log( ' - Done' );
	}
}

async function emptyContent( cwd, spinner ) {
	if ( spinner ) {
		spinner.start( 'Removing the default WordPress content...' );
	} else {
		console.log( 'Remove the default WordPress content:' );
	}

	await compose.exec( 'phpfpm', 'wp site empty --yes', { cwd, log: ! spinner } );
	await compose.exec( 'phpfpm', 'wp plugin delete hello akismet', { cwd, log: ! spinner } );
	await compose.exec( 'phpfpm', 'wp theme delete twentyfifteen twentysixteen twentyseventeen twentyeighteen twentynineteen', { cwd, log: ! spinner } );
	await compose.exec( 'phpfpm', 'wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2', { cwd, log: ! spinner } );

	if ( spinner ) {
		spinner.succeed( 'The default content is removed...' );
	} else {
		console.log( ' - Done' );
	}
}

module.exports = function makeInstallWordPress( spinner, chalk ) {
	return async ( hostname, settings ) => {
		const { wordpress, certs, envSlug } = settings;
		if ( ! wordpress ) {
			return;
		}

		try {
			const cwd = await envUtils.envPath( envSlug );

			await downloadWordPress( wordpress.type, cwd, spinner, chalk );
			await configure( envSlug, cwd, spinner );
			await install( hostname, wordpress, certs, cwd, spinner );
			await setRewrites( cwd, spinner );

			if ( wordpress.purify ) {
				await emptyContent( cwd, spinner );
			}
		} catch( error ) {
			if ( spinner ) {
				spinner.stop();
			}

			if ( error.err ) {
				throw new Error( error.err );
			} else {
				throw error;
			}
		}
	};
};
