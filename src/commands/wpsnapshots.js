const { execSync } = require( 'child_process' );

const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const shellEscape = require( 'shell-escape' );
const envUtils = require( '../env-utils' );
const gateway = require( '../gateway' );
const environment = require( '../environment' );
const compose = require( '../utils/docker-compose' );

exports.command = 'wpsnapshots <cmd..>';
exports.aliases = [ 'snapshots' ];
exports.desc = 'Runs a wp snapshots command.';

exports.builder = function( yargs ) {
	yargs.positional( 'cmd', {
		describe: 'Command to run',
		type: 'string',
	} );
};

exports.handler = makeCommand( async function( { env, verbose } ) {
	let envSlug = env;
	if ( ! envSlug ) {
		envSlug = await envUtils.parseOrPromptEnv();
	}

	if ( envSlug === false ) {
		throw new Error( 'Error: Unable to determine which environment to use snapshots with. Please run this command from within your environment\'s directory.' );
	}

	const envPath = await envUtils.envPath( envSlug );
	const spinner = ! verbose ? makeSpinner() : undefined;

	// Check if the container is running, otherwise, start up the stacks
	const isRunning = await compose.isRunning( envPath );
	if ( ! isRunning ) {
		spinner && spinner.info( 'Environment is not running, starting it...' );
		await gateway.startGlobal( spinner );
		await environment.start( envSlug, spinner );
	}

	// Compose wp-cli command to run
	let snapshotCommand = false;
	const command = [
		'wp',
		'snapshots',
	];
	for ( let i = 0; i < process.argv.length; i++ ) {
		if ( process.argv[i].toLowerCase() === 'wpsnapshots' || process.argv[i].toLowerCase() === 'snapshots' ) {
			snapshotCommand = true;
			continue;
		}

		if ( snapshotCommand ) {
			command.push( process.argv[i] );
		}
	}

	try {
		// Check for TTY
		const ttyFlag = process.stdin.isTTY ? '' : ' -T';

		// Run the command
		execSync( `docker-compose exec${ ttyFlag } phpfpm ${ shellEscape( command ) }`, {
			stdio: 'inherit',
			cwd: envPath
		} );
	} catch {
		// do nothing
	}
} );
