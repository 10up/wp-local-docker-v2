const { execSync } = require( 'child_process' );

const envUtils = require( '../env-utils' );
const gateway = require( '../gateway' );
const environment = require( '../environment' );
const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const compose = require( '../utils/docker-compose' );

exports.command = 'shell [<container>] [<cmd>]';
exports.desc = 'Opens a shell for a specified container in your current environment (Defaults to the phpfpm container).';

exports.builder = function( yargs ) {
	yargs.positional( 'container', {
		describe: 'Container name',
		type: 'string',
		default: 'phpfpm',
	} );

	yargs.positional( 'cmd', {
		describe: 'Command to run',
		type: 'string',
		default: 'bash',
	} );
};

exports.handler = makeCommand( async ( { container, cmd, env, verbose } ) => {
	let envSlug = env;
	if ( ! envSlug ) {
		envSlug = await envUtils.parseOrPromptEnv();
	}

	if ( envSlug === false ) {
		throw new Error( 'Error: Unable to determine which environment to open a shell for. Please run this command from within your environment.' );
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

	try {
		execSync( `docker-compose exec ${ container } ${ cmd }`, {
			stdio: 'inherit',
			cwd: envPath,
		} );
	} catch {
	}
} );
