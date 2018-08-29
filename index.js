#!/usr/bin/env node

function help() {
	console.log( "HELP ME!" );
}

if ( process.argv.length < 3 ) {
	help();
} else {
    switch( process.argv[2].toLowerCase() ) {
        case 'create':
            require( './src/create-env.js' );
            break;
        case 'start':
        case 'stop':
        case 'restart':
        case 'remove':
            require( './src/environment.js' );
            break;
        default:
            help();
            break;
    }
}
