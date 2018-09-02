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
  restart       Restarts a specific docker environment
  shell         Opens a shell for a specified container in your current environment. Defaults to the phpfpm container.
  start         Starts a specific docker environment
  stop          Stops a specific docker environment
  wpsnapshots   Runs a wp snapshots command

Run '10updocker COMMAND help' for more information on a command.
`;
    console.log( help );
};

const init = async function() {
    let command = commandUtils.command();
    let configured = await config.checkIfConfigured();

    // Show warning about not being configured unless we are trying to get help or run the configure command
    if ( configured === false && [ undefined, 'configure', 'help' ].indexOf( command ) === -1 ) {
        console.error( 'Error: WP Local Docker not configured. Please run `10updocker configure`' );
        process.exit(1);
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
        default:
            help();
            break;
    }
};
init();
