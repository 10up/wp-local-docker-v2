#!/usr/bin/env node

const yargs = require( 'yargs' );
const chalk = require( 'chalk' );
const commandUtils = require( './src/command-utils' );
const config = require( './src/configure' );

function dispatcher( cmd, withChecks = true ) {
    return async () => {
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
        await require( `./src/${cmd}` ).command();
    };
}

// usage and help flag
yargs.scriptName( '10updocker' );
yargs.usage( 'Usage: 10updocker <command>' );
yargs.help( 'h' );
yargs.alias( 'h', 'help' );
yargs.alias( 'v', 'version' );

// global options
yargs.option( 'verbose', {
    description: 'Display extended output',
    default: false,
    type: 'boolean',
} );

// commands
yargs.commandDir( 'src/commands' );
yargs.command( 'cache', 'Manages the build cache.', {}, dispatcher( 'cache' ) );
yargs.command( 'configure', 'Set up a configuration for WP Local Docker.', {}, dispatcher( 'configure', false ) );
yargs.command( [ 'delete', 'remove' ], 'Deletes a specific environment.', {}, dispatcher( 'environment' ) );
yargs.command( 'image', 'Manages docker images used by this environment.', {}, dispatcher( 'image' ) );
yargs.command( 'logs', 'Shows logs from the specified container in your current environment (Defaults to all containers).', {}, dispatcher( 'logs' ) );
yargs.command( 'migrate', 'Migrates a V1 WP Local Docker environment to a new V2 environment.', {}, dispatcher( 'migrate' ) );
yargs.command( 'restart', 'Restarts a specific docker environment.', {}, dispatcher( 'environment' ) );
yargs.command( 'shell', 'Opens a shell for a specified container in your current environment (Defaults to the phpfpm container).', {}, dispatcher( 'shell' ) );
yargs.command( 'start', 'Starts a specific docker environment.', {}, dispatcher( 'environment' ) );
yargs.command( 'stop', 'Stops a specific docker environment.', {}, dispatcher( 'environment' ) );
yargs.command( 'wp', 'Runs a wp-cli command in your current environment.', {}, dispatcher( 'wp' ) );
yargs.command( [ 'wpsnapshots', 'snapshots' ], 'Runs a wp snapshots command.', {}, dispatcher( 'wpsnapshots' ) );
yargs.command( 'upgrade', false, {}, dispatcher( 'environment' ) ); // @todo: currently hidden command, provide a proper description to make it public

// parse and process CLI args
yargs.demandCommand();
yargs.parse();
