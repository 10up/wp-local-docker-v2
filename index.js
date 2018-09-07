#!/usr/bin/env node

const commandUtils = require( './src/command-utils' );
const config = require( './src/configure' );

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
    console.log( 'WP Local Docker Generator' );
    console.log( `Version ${pjson.version}` );
};

const init = async function() {
    let command = commandUtils.command();
    let configured = await config.checkIfConfigured();
    let bypassCommands = [ undefined, 'configure', 'help', '--version', '-v' ];

    // Show warning about not being configured unless we are trying to get help, version, or configure commands
    if ( configured === false && bypassCommands.indexOf( command ) === -1 ) {
        await config.promptUnconfigured();
    }

    let isRunning = commandUtils.checkIfDockerRunning();

    // Show warning if docker isn't running
    if ( isRunning === false && bypassCommands.indexOf( command ) === -1 ) {
        console.error( "Error: Docker doesn't appear to be running. Please start Docker and try again" );
        process.exit();
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
