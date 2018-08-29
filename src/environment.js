#!/usr/bin/env node

if ( require.main.filename.indexOf( 'index.js' ) === -1 ) {
    console.error( "ERROR: Do not run create-env.js directly. Run the `10up-docker create` command instead." );
    process.exit(1);
}

const path = require('path');
const fs = require( 'fs-extra' );
const slugify = require('@sindresorhus/slugify');
const execSync = require('child_process').execSync;

// Setup some paths for reference later
const rootPath = path.dirname( require.main.filename );
const sitePath = path.join( rootPath, 'sites' );

function help() {
    console.log( "Environment Help" );
}

function ensureNetworkExists() {
    try {
        console.log( "Ensuring network exists" );
        let networks = execSync( "docker network ls --filter name=wplocaldocker" ).toString();
        if ( networks.indexOf( 'wplocaldocker' ) !== -1 ) {
            console.log( " - Network exists" );
            return;
        }

        console.log( " - Creating network" );
        execSync('docker network create wplocaldocker');
    } catch (ex) {}
}

function startGateway() {
    try {
        console.log( "Ensuring global services are running" );
        let globalPath = path.join( rootPath, 'global' );
        execSync( "cd " + globalPath + " && docker-compose up -d" );
    } catch ( ex ) {}
}



function start( env ) {
    ensureNetworkExists();
    startGateway();

    console.log( "Locating project files for " + env );

    let envSlug = slugify( env );
    let envPath = path.join( sitePath, envSlug );
    if ( ! fs.pathExistsSync( envPath ) ) {
        console.error( "ERROR: Cannot find " + env + " site!" );
        exit(1);
    }

    console.log( " - Starting docker containers..." );
    execSync( "cd " + envPath + " && docker-compose up -d" );
}


if ( process.argv.length < 4 ) {
    help();
} else {
    switch( process.argv[2].toLowerCase() ) {
        case 'start':
            start( process.argv[3] );
            break;
        case 'stop':

            break;
        case 'restart':

            break;
        case 'remove':

            break;
        default:
            help();
            break;
    }
}
