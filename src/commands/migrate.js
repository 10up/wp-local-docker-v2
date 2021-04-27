const path = require( 'path' );
const { execSync } = require( 'child_process' );
const { exec } = require( 'child_process' );

const fs = require( 'fs-extra' );
const chalk = require( 'chalk' );

const envUtils = require( '../env-utils' );
const { start } = require( '../environment' );
const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const compose = require( '../utils/docker-compose' );

exports.command = 'migrate <old> [<env>]';
exports.desc = 'Migrates a V1 WP Local Docker environment to a new V2 environment. Before running this command, create a new environment using the `10updocker create` command.';

exports.builder = function( yargs ) {
	yargs.positional( 'old', {
		type: 'string',
		describe: 'Path to the old environment.',
	} );

	yargs.positional( 'env', {
		type: 'string',
		describe: 'Optional. Environment to migrate the V1 data into.',
	} );
};

// Kind of like the one for gateway, but not using docker compose and adapted for this purpose
function waitForDB( containerName ) {
	const readyMatch = 'ready for connections';
	return new Promise( resolve => {
		const interval = setInterval( () => {
			console.log( 'Waiting for mysql...' );
			exec( `docker logs ${ containerName }`, ( error, stdout, stderr ) => {
				if ( error ) {
					console.error( 'Error exporting database!' );
					process.exit();
				}

				if ( stderr.indexOf( readyMatch ) !== -1 ) {
					clearInterval( interval );
					resolve();
				}
			} );
		}, 1000 );
	} );
}

async function exportOldDatabase( oldEnv, exportDir ) {
	const dataDir = path.join( oldEnv, 'data', 'db' );
	const parts = path.parse( oldEnv );
	const base = `mysql-${ parts.name }`;

	// Just in case this failed and are retrying
	try {
		execSync( `docker stop ${ base }`, { stdio: 'ignore' } );
		execSync( `docker rm ${ base }`, { stdio: 'ignore' } );
	} catch {
	}

	try {
		execSync( `docker run -d --rm --name ${ base } -v ${ dataDir }:/var/lib/mysql -v ${ exportDir }:/tmp/export mysql:5`, { stdio: 'inherit' } );
		await waitForDB( base );
		console.log( 'Exporting old database' );
		execSync( `docker exec ${ base } sh -c "/usr/bin/mysqldump -u root -ppassword wordpress > /tmp/export/database.sql"`, { stdio: 'inherit' } );
		execSync( `docker stop ${ base }` );
	} catch {
	}
}

async function importNewDatabase( env, spinner ) {
	await start( env, spinner );
	const envPath = await envUtils.getPathOrError( env );

	try {
		console.log( 'Importing DB to new Environment' );
		execSync( 'docker-compose exec --user www-data phpfpm wp db import /var/www/html/import/database.sql', { stdio: 'inherit', cwd: envPath } );
	} catch {
	}
}

async function copySiteFiles( oldEnv, newEnv ) {
	const envPath = await envUtils.getPathOrError( newEnv );
	const wpContent = path.join( envPath, 'wordpress', 'wp-content' );
	const oldWpContent = path.join( oldEnv, 'wordpress', 'wp-content' );

	// Clear out all the current environment content
	// Only doing wp-content for now, since otherwise we would need to keep wp-config.php... But what about customizations?
	console.log( `Removing current files from ${ wpContent }` );
	await fs.emptyDir( wpContent );

	console.log( 'Copying files from the old wp-content folder' );
	await fs.copy( oldWpContent, wpContent );
}

exports.handler = makeCommand( async function( { old, env, verbose } ) {
	const spinner = ! verbose ? makeSpinner() : undefined;
	const oldEnv = path.resolve( old );

	// So that we don't prompt at every step...
	let envName = env;
	if ( ! envName ) {
		envName = await envUtils.promptEnv();
	}

	// Validate old environment
	if ( ! await fs.pathExists( path.join( oldEnv, 'docker-compose.yml' ) ) ) {
		throw new Error( 'Could not find a docker-compose.yml file in the path specified for the old environment!' );
	}

	if ( ! await fs.pathExists( path.join( oldEnv, 'data', 'db' ) ) ) {
		throw new Error( 'Could not find MySQL data in the path specified for the old environment!' );
	}

	// Stopping old environment
	if ( spinner ) {
		spinner.start( 'Ensuring old environment is stopped...' );
	} else {
		console.log( 'Ensuring old environment is not running...' );
	}

	await compose.down( {
		cwd: oldEnv,
		log: ! spinner,
	} );

	if ( spinner ) {
		spinner.succeed( 'Old environment is stopped...' );
	}

	// So that the DB is already in the folder mounted to docker
	const envPath = await envUtils.getPathOrError( envName );
	const exportDir = path.join( envPath, 'wordpress', 'import' );
	await fs.ensureDir( exportDir );

	await exportOldDatabase( oldEnv, exportDir );
	await importNewDatabase( envName, spinner );
	await copySiteFiles( oldEnv, envName );

	console.log( `${ chalk.bold.green( 'Success!' ) } Your environment has been imported!` );
	console.log( ' - wp-config.php has not been changed. Any custom configuration needs to be manually copied' );
	console.log( ' - If you need to run a search/replace, run `10updocker wp search-replace <olddomain> <newdomain>`' );
} );
