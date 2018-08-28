#!/usr/bin/env node

function help() {
	console.log( "HELP ME!" );
}

function create() {
	require( './src/create-env.js' );
}

function gateway() {
	require( './src/gateway.js' );
}

if ( process.argv.length < 3 ) {
	help();
} else {
    switch( process.argv[2].toLowerCase() ) {
        case 'create':
            create();
            break;
        case 'gateway':
            gateway();
            break;
        default:
            help();
            break;
    }
}
