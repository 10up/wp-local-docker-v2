#!/usr/bin/env node

const create = require('./src/create');
const environment = require('./src/environment');

const help = function() {
	let help = `
Usage: 10up-docker COMMAND

Commands:
  create    Create a new docker environment
  delete    Deletes a specific docker environment
  restart   Restarts a specific docker environment
  start     Starts a specific docker environment
  stop      Stops a specific docker environment

Run '10up-docker COMMAND help' for more information on a command.
`;
    console.log( help );
};

if ( process.argv.length < 3 ) {
	help();
} else {
    // Don't wait for startup if just looking for help
    if ( undefined !== process.argv[3] && 'help' === process.argv[3].toLowerCase() ) {
        switch( process.argv[2].toLowerCase() ) {
            case 'create':
                create.help();
                break;
            case 'start':
            case 'stop':
            case 'restart':
            case 'delete':
                environment.help();
                break;
            default:
                help();
                break;
        }
    } else {
        // Make sure the global services are up and ready to go before anything else
        environment.startGlobal().then(() => {
            console.log(); // For readability of logs

            switch( process.argv[2].toLowerCase() ) {
                case 'create':
                    require( './src/create-env' );
                    break;
                case 'start':
                    if ( 'all' === process.argv[3] ) {
                        environment.startAll();
                    } else {
                        environment.start( process.argv[3] );
                    }
                    break;
                case 'stop':
                    if ( 'all' === process.argv[3] ) {
                        environment.stopAll();
                    } else {
                        environment.stop( process.argv[3] );
                    }
                    break;
                case 'restart':
                    if ( 'all' === process.argv[3] ) {
                        environment.restartAll();
                    } else {
                        environment.restart( process.argv[3] );
                    }
                    break;
                case 'delete':
                    environment.deleteEnv( process.argv[3] );
                    break;
                default:
                    help();
                    break;
            }
        });
    }

}
