#!/usr/bin/env node

const yargs = require( 'yargs' );
const chalk = require( 'chalk' );

const commandUtils = require( './src/command-utils' );
const config = require( './src/configure' );

function dispatcher( cmd, withChecks = true ) {
    return async ( ...params ) => {
        if ( withChecks ) {
            // Configure using defaults if not configured already
            const configured = await config.checkIfConfigured();
            if ( configured === false ) {
                await config.configureDefaults();
            }

            // Show warning if docker isn't running
            if ( commandUtils.checkIfDockerRunning() === false ) {
                console.error( chalk.red( 'Error: Docker doesn\'t appear to be running. Please start Docker and try again' ) );
                process.exit( 1 );
            }
        }

        await commandUtils.checkForUpdates();
        await require( `./src/${cmd}` ).command( ...params );
    };
}

// usage and help flag
yargs.scriptName( '10updocker' );
yargs.usage( 'Usage: 10updocker <command>' );
yargs.wrap( Math.min( 120, yargs.terminalWidth() ) );
yargs.help( 'h' );
yargs.alias( 'h', 'help' );
yargs.alias( 'v', 'version' );

// global options
yargs.option( 'verbose', {
    description: 'Display extended output',
    default: false,
    type: 'boolean',
} );

yargs.option( 'env', {
    description: 'Environment name',
    default: false,
    type: 'string',
} );

// environment arguments
const envArgs = () => {
    yargs.positional( 'env', {
        type: 'string',
        describe: 'Optional. Environment name.',
    } );
};

// commands
yargs.commandDir( 'src/commands' );
yargs.command( 'start [env]', 'Starts a specific docker environment.', envArgs, dispatcher( 'environment' ) );
yargs.command( 'stop [env]', 'Stops a specific docker environment.', envArgs, dispatcher( 'environment' ) );
yargs.command( 'restart [env]', 'Restarts a specific docker environment.', envArgs, dispatcher( 'environment' ) );
yargs.command( [ 'delete [env]', 'remove [env]' ], 'Deletes a specific environment.', envArgs, dispatcher( 'environment' ) );
yargs.command( 'cache', 'Manages the build cache.', {}, dispatcher( 'cache' ) );
yargs.command( 'configure', 'Set up a configuration for WP Local Docker.', {}, dispatcher( 'configure', false ) );
yargs.command( 'image', 'Manages docker images used by this environment.', {}, dispatcher( 'image' ) );
yargs.command( 'migrate', 'Migrates a V1 WP Local Docker environment to a new V2 environment.', {}, dispatcher( 'migrate' ) );
yargs.command( [ 'wpsnapshots', 'snapshots' ], 'Runs a wp snapshots command.', {}, dispatcher( 'wpsnapshots' ) );
yargs.command( 'upgrade', false, {}, dispatcher( 'environment' ) ); // @todo: currently hidden command, provide a proper description to make it public

// parse and process CLI args
yargs.demandCommand();
yargs.parse();
