#!/usr/bin/env node

if ( require.main.filename.indexOf( 'index.js' ) === -1 ) {
    process.exit(1);
}

const path = require('path');
const fs = require( 'fs-extra' );
const slugify = require('@sindresorhus/slugify');
const execSync = require('child_process').execSync;

// Setup some paths for reference later
const rootPath = path.dirname( require.main.filename );
const sitePath = path.join( rootPath, 'sites' );

const ensureNetworkExists = function() {
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
};

const startGateway = function() {
    try {
        console.log( "Ensuring global services are running" );
        let globalPath = path.join( rootPath, 'global' );
        execSync( "cd " + globalPath + " && docker-compose up -d" );
    } catch ( ex ) {}
};

const startGlobal = function() {
    ensureNetworkExists();
    startGateway();
};

const getPathOrError = function( env ) {
    console.log( "Locating project files for " + env );

    let envSlug = slugify( env );
    let envPath = path.join( sitePath, envSlug );
    if ( ! fs.pathExistsSync( envPath ) ) {
        console.error( "ERROR: Cannot find " + env + " site!" );
        exit(1);
    }

    return envPath;
};

const start = function( env ) {
    startGlobal();
    let envPath = getPathOrError(env);

    console.log( `Starting docker containers for ${env}...` );
    execSync( `cd ${envPath} && docker-compose up -d` );
};

const stop = function( env ) {
    let envPath = getPathOrError(env);

    console.log( `Stopping docker containers for ${env}...` );
    execSync( `cd ${envPath} && docker-compose down` );
};

module.exports = { startGlobal, start, stop };
