const path = require( 'path' );

const fsExtra = require( 'fs-extra' );
const inquirer = require( 'inquirer' );
const sudo = require( 'sudo-prompt' );
const chalk = require( 'chalk' );
const which = require( 'which' );

const config = require( './configure' );
const promptValidators = require( './prompt-validators' );
const database = require( './database' );
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const compose = require( './utils/docker-compose' );

async function start( env, spinner, pull ) {
	const envPath = await envUtils.getPathOrError( env, spinner );
	const envSlug = envUtils.envSlug( env );

	await gateway.startGlobal( spinner, pull );

	const composeArgs = {
		cwd: envPath,
		log: !spinner,
	};

	if ( pull ) {
		if ( spinner ) {
			spinner.start( `Pulling latest images for ${ chalk.cyan( envSlug ) }...` );
		} else {
			console.log( 'Pulling latest images for containers' );
		}

		await compose.pullAll( composeArgs );

		if ( spinner ) {
			spinner.succeed( `${ chalk.cyan( envSlug ) } images are up-to-date...` );
		}
	}

	if ( spinner ) {
		spinner.start( `Starting docker containers for ${ chalk.cyan( envSlug ) }...` );
	} else {
		console.log( `Starting docker containers for ${ envSlug }` );
	}

	await compose.upAll( composeArgs );

	if ( spinner ) {
		spinner.succeed( `${ chalk.cyan( envSlug ) } is started...` );
	} else {
		console.log();
	}
}

async function stop( env, spinner ) {
	const envPath = await envUtils.getPathOrError( env, spinner );
	const envSlug = envUtils.envSlug( env );

	if ( spinner ) {
		spinner.start( `Stopping docker containers for ${ chalk.cyan( envSlug ) }...` );
	} else {
		console.log( `Stopping docker containers for ${ envSlug }` );
	}

	await compose.down( {
		cwd: envPath,
		log: !spinner,
	} );

	if ( spinner ) {
		spinner.succeed( `${ chalk.cyan( envSlug ) } is stopped...` );
	} else {
		console.log();
	}
}

async function restart( env, spinner ) {
	const envPath = await envUtils.getPathOrError( env, spinner );
	const envSlug = envUtils.envSlug( env );

	await gateway.startGlobal( spinner );

	if ( spinner ) {
		spinner.start( `Restarting docker containers for ${ chalk.cyan( envSlug ) }...` );
	} else {
		console.log( `Restarting docker containers for ${ envSlug }` );
	}

	const composeArgs = {
		cwd: envPath,
		log: !spinner,
	};

	const isRunning = await compose.isRunning( envPath );
	if ( isRunning ) {
		await compose.restartAll( composeArgs );

		if ( spinner ) {
			spinner.succeed( `${ chalk.cyan( envSlug ) } is restarted...` );
		}
	} else {
		if ( spinner ) {
			spinner.info( 'Environment is not running, starting it...' );
			spinner.start( `Starting docker containers for ${ chalk.cyan( envSlug ) }...` );
		}

		await compose.upAll( composeArgs );

		if ( spinner ) {
			spinner.succeed( `${ chalk.cyan( envSlug ) } is started...` );
		}
	}
}

async function deleteEnv( env, spinner ) {
	const envSlug = envUtils.envSlug( env );
	const envPath = await envUtils.getPathOrError( env, spinner );
	const envHosts = await envUtils.getEnvHosts( envPath );

	const answers = await inquirer.prompt( {
		name: 'confirm',
		type: 'confirm',
		message: `Are you sure you want to delete the ${ envSlug } environment`,
		validate: promptValidators.validateNotEmpty,
		default: false,
	} );

	if ( answers.confirm === false ) {
		return;
	}

	await gateway.startGlobal( spinner );

	// Stop the environment, and ensure volumes are deleted with it
	if ( spinner ) {
		spinner.start( 'Deleting containers...' );
	} else {
		console.log( 'Deleting containers' );
	}

	try {
		await compose.down( {
			cwd: envPath,
			log: !spinner,
			commandOptions: [ '-v' ],
		} );
	} catch ( ex ) {
		// If the docker-compose file is already gone, this happens
	}

	if ( spinner ) {
		spinner.start( 'Containers are deleted...' );
	}

	if ( spinner ) {
		spinner.start( 'Deleting environment files...' );
	} else {
		console.log( 'Deleting Files' );
	}

	await fsExtra.remove( envPath );

	if ( spinner ) {
		spinner.succeed( 'Environment files are deleted...' );
		spinner.start( 'Deleting certificates...' );
	} else {
		console.log( 'Deleting Certificates' );
	}

	const sslDir = await config.getSslCertsDirectory( false );
	const filename = path.join( sslDir, envSlug );
	await fsExtra.remove( `${ filename }.crt` );
	await fsExtra.remove( `${ filename }.key` );

	if ( spinner ) {
		spinner.succeed( 'Environment certificates are deleted...' );
		spinner.start( 'Deleting database...' );
	} else {
		console.log( 'Deleting Database' );
	}

	await database.deleteDatabase( envSlug );

	if ( spinner ) {
		spinner.succeed( 'Database is deleted...' );
	}

	if ( await config.get( 'manageHosts' ) === true ) {
		try {
			if ( spinner ) {
				spinner.start( 'Removing host file entries...' );
			} else {
				console.log( 'Removing host file entries' );
			}

			const sudoOptions = { name: 'WP Local Docker' };
			const node = await which( 'node' );
			const hostsScript = path.join( path.resolve( __dirname, '..' ), 'hosts.js' );
			const hostsToDelete = envHosts.join( ' ' );

			await new Promise( resolve => {
				if ( !spinner ) {
					console.log( ` - Removing ${ hostsToDelete }` );
				}

				sudo.exec( `${ node } ${ hostsScript } remove ${ hostsToDelete }`, sudoOptions, ( error, stdout ) => {
					if ( error ) {
						if ( spinner ) {
							spinner.warn( 'Something went wrong deleting host file entries. There may still be remnants in /etc/hosts' );
						} else {
							console.error( `${ chalk.bold.yellow( 'Warning: ' ) }Something went wrong deleting host file entries. There may still be remnants in /etc/hosts` );
						}
					} else {
						if ( spinner ) {
							spinner.succeed( 'Host file entries are deleted...' );
						} else {
							console.log( stdout );
						}
					}

					resolve();
				} );
			} );
		} catch ( err ) {
			// Unfound config, etc
			if ( spinner ) {
				spinner.warn( 'Something went wrong deleting host file entries. There may still be remnants in /etc/hosts' );
			} else {
				console.error( `${ chalk.bold.yellow( 'Warning: ' ) }Something went wrong deleting host file entries. There may still be remnants in /etc/hosts` );
			}
		}
	}
}

async function startAll( spinner, pull ) {
	const envs = await envUtils.getAllEnvironments();

	await gateway.startGlobal( spinner, pull );

	for ( let i = 0, len = envs.length; i < len; i++ ) {
		await start( envs[i], spinner, pull );
	}
}

async function stopAll( spinner ) {
	const envs = await envUtils.getAllEnvironments();

	for ( let i = 0, len = envs.length; i < len; i++ ) {
		await stop( envs[ i ], spinner );
	}

	await gateway.stopGlobal( spinner );
}

async function restartAll( spinner ) {
	const envs = await envUtils.getAllEnvironments();

	for ( let i = 0, len = envs.length; i < len; i++ ) {
		await restart( envs[ i ], spinner );
	}

	await gateway.restartGlobal( spinner );
}

async function deleteAll( spinner ) {
	const envs = await envUtils.getAllEnvironments();

	for ( let i = 0, len = envs.length; i < len; i++ ) {
		await deleteEnv( envs[ i ], spinner );
	}
}

module.exports = {
	start,
	startAll,
	stop,
	stopAll,
	deleteEnv,
	deleteAll,
	restart,
	restartAll,
};
