#!/usr/bin/env node

const environment = require('./src/environment.js');

function help() {
	console.log( "HELP ME!" );
}

if ( process.argv.length < 3 ) {
	help();
} else {
    switch( process.argv[2].toLowerCase() ) {
        case 'create':
            environment.startGlobal();
            require( './src/create-env.js' );
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
        case 'delete':

            break;
        default:
            help();
            break;
    }
}
