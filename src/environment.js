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
        console.log( "Ensuring gateway is running" );
        let gateways = execSync( "docker ps -a --filter name=wplocaldocker-gateway" ).toString();

        // Container is running.. Nothing to do here
        if ( gateways.indexOf( 'Up' ) !== -1 ) {
            console.log( " - Gateway Running" );
            return;
        }

        // Container is stopped. Remove it before moving on
        if ( gateways.indexOf( 'Exited' ) !== -1 ) {
            console.log( " - Gateway stopped. Removing container" );
            execSync( "docker rm wplocaldocker-gateway" );
        }

        // Start the gateway
        console.log( " - Starting gateway" );
        execSync('docker run -d --name wplocaldocker-gateway -p 80:80 -p 9200:9200 --network wplocaldocker -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy');
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
