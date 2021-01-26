#!/usr/bin/env node

const yargs = require( 'yargs' );
const hostile = require( 'hostile' );

function options( yargs ) {
	yargs.positional( 'hosts', {
		describe: 'A host domain name.',
		type: 'string',
	} );
}

function add( { hosts } ) {
	hostile.set( '127.0.0.1', hosts.join( ' ' ), function( err ) {
		if ( err ) {
			console.error( err.message );
			process.exit( err.errno );
		} else {
			console.log( 'Added to hosts file successfully!' );
		}
	} );
}

function remove( { hosts } ) {
	hostile.remove( '127.0.0.1', hosts.join( ' ' ), function( err ) {
		if ( err ) {
			console.error( err.message );
			process.exit( err.errno );
		} else {
			console.log( 'Removed from hosts file successfully!' );
		}
	} );
}

// usage and help flag
yargs.scriptName( '10updocker-hosts' );
yargs.usage( 'Usage: 10updocker-hosts <command>' );
yargs.help( 'h' );
yargs.alias( 'h', 'help' );

// commands
yargs.command( 'add <hosts..>', 'Add new hosts to the hosts file.', options, add );
yargs.command( 'remove <hosts..>', 'Remove hosts from the hosts file.', options, remove );

// parse and process CLI args
yargs.demandCommand();
yargs.parse();
