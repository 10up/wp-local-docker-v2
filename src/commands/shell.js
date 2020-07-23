const { EOL } = require( 'os' );
const { execSync } = require( 'child_process' );

const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );
const compose = require( 'docker-compose' );

const envUtils = require( '../env-utils' );
const gateway = require( '../gateway' );
const environment = require( '../environment' );
const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );

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

exports.handler = makeCommand( chalk, logSymbols, async ( { container, cmd, env, verbose } ) => {
    let envSlug = env;
    if ( ! envSlug ) {
        envSlug = await envUtils.parseOrPromptEnv();
    }

    if ( envSlug === false ) {
        throw new Error( 'Error: Unable to determine which environment to open a shell for. Please run this command from within your environment.' );
    }

    const envPath = await envUtils.envPath( envSlug );
    const spinner = ! verbose ? makeSpinner() : undefined;

    spinner && spinner.start( 'Checking if the environment running...' );
    // Check if the container is running, otherwise, start up the stacks
    const { out } = await compose.ps( {
        cwd: envPath,
    } );

    if ( out.split( EOL ).filter( ( line ) => line.trim().length > 0 ).length <= 2 ) {
        spinner && spinner.info( 'Environment is not running, starting it...' );
        await gateway.startGlobal( spinner );
        await environment.start( envSlug, spinner );
    } else {
        spinner && spinner.succeed( 'Environment is running...' );
    }

    execSync( `docker-compose exec ${ container } ${ cmd }`, {
        stdio: 'inherit',
        cwd: envPath,
    } );
} );
