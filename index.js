#!/usr/bin/env node

const chalk = require( 'chalk' );
const commandUtils = require( './src/command-utils' );
const config = require( './src/configure' );
const snapshots = require( './src/wpsnapshots' );

const help = function() {
    let help = `
Usage: 10updocker COMMAND

Commands:
  cache         Manages the build cache
  configure     Set up a configuration for WP Local Docker
  create        Create a new docker environment
  delete        Deletes a specific docker environment
  image         Manages docker images used by this environment
  logs          Shows logs from the specified container in your current environment (Defaults to all containers)
  restart       Restarts a specific docker environment
  shell         Opens a shell for a specified container in your current environment (Defaults to the phpfpm container)
  start         Starts a specific docker environment
  stop          Stops a specific docker environment
  wp            Runs a wp-cli command in your current environment
  wpsnapshots   Runs a wp snapshots command

Run '10updocker COMMAND help' for more information on a command.
`;
    console.log( help );
};

const version = function() {
    var pjson = require('./package.json');
    console.log( 'WP Local Docker' );
    console.log( `Version ${pjson.version}` );
};

const init = async function() {
    let command = commandUtils.command();
    let configured = await config.checkIfConfigured();
    let bypassCommands = [ undefined, 'configure', 'help', '--version', '-v' ];
    let isBypass = bypassCommands.indexOf( command ) !== -1;

    // Configure using defaults if not configured already
    if ( configured === false && isBypass === false ) {
        await config.configureDefaults();
    }

    // Don't even run the command to check if docker is running if we have one of the commands that don't need it
    if ( isBypass === false ) {
        let isRunning = commandUtils.checkIfDockerRunning();

        // Show warning if docker isn't running
        if ( isRunning === false ) {
            console.error( chalk.red( "Error: Docker doesn't appear to be running. Please start Docker and try again" ) );
            process.exit();
        }
    }

    await commandUtils.checkForUpdates();

    if ( isBypass === false && await snapshots.checkIfConfigured() === false && ! ( ['wpsnapshots', 'snapshots'].indexOf( command )  !== -1 && commandUtils.subcommand() === 'configure' ) ) {
        console.warn( chalk.bold.yellow( "Warning: " ) + chalk.yellow( "WP Snapshots is not configured" ) );
        console.warn( chalk.yellow( "Run `10updocker wpsnapshots configure` to set up WP Snapshots" ) );
        console.log();
    }

    switch ( command ) {
        case 'configure':
            config.command();
            break;
        case 'create':
            await require('./src/create').command();
            break;
        case 'start':
        case 'stop':
        case 'restart':
        case 'delete':
        case 'remove':
            await require('./src/environment').command();
            break;
        case 'snapshots':
        case 'wpsnapshots':
            await require('./src/wpsnapshots').command();
            break;
        case 'cache':
            await require('./src/cache').command();
            break;
        case 'image':
            await require('./src/image').command();
            break;
        case 'shell':
            await require( './src/shell' ).command();
            break;
        case 'wp':
            await require( './src/wp' ).command();
            break;
        case 'logs':
            await require( './src/logs' ).command();
            break;
        case '--version':
        case '-v':
            version();
            break;
        default:
            help();
            break;
    }
};
init();
