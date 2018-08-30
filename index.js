#!/usr/bin/env node

const commandUtils = require( './src/command-utils' );

const help = function() {
    let help = `
Usage: 10up-docker COMMAND

Commands:
  cache         Manages the build cache
  create        Create a new docker environment
  delete        Deletes a specific docker environment
  restart       Restarts a specific docker environment
  start         Starts a specific docker environment
  stop          Stops a specific docker environment
  wpsnapshots   Runs a wp snapshots command

Run '10up-docker COMMAND help' for more information on a command.
`;
    console.log( help );
};

const init = async function() {
    switch ( commandUtils.command() ) {
        case 'create':
            await require('./src/create').command();
            break;
        case 'start':
        case 'stop':
        case 'restart':
        case 'delete':
            await require('./src/environment').command();
            break;
        case 'snapshots':
        case 'wpsnapshots':
            await require('./src/wpsnapshots').command();
            break;
        case 'cache':
            await require('./src/cache').command();
            break;
        default:
            help();
            break;
    }
};
init();
