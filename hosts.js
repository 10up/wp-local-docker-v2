#!/usr/bin/env node

const hostile = require( 'hostile' );
const commandUtils = require( './src/command-utils' );

const add = function( hosts ) {
    hostile.set( '127.0.0.1', hosts, function( err ) {
        if (err) {
            console.error(err)
        } else {
            console.log('Added to hosts file successfully!')
        }
    });
};

const remove = function( hosts ) {
    hostile.remove( '127.0.0.1', hosts, function( err ) {
        if (err) {
            console.error(err)
        } else {
            console.log('Removed from hosts file successfully!')
        }
    });
};

const command = function() {
    let mode = commandUtils.command();
    let args = commandUtils.commandArgs();

    switch( mode ) {
        case 'add':
            add( args );
            break;
        case 'remove':
            remove( args );
            break;
        default:
            console.error( "Invalid hosts command" );
            process.exit(1);
            break;
    }
};
command();
