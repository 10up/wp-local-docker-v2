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
            environment.start( process.argv[3] );
            break;
        case 'stop':
        case 'restart':
        case 'remove':

            break;
        default:
            help();
            break;
    }
}
