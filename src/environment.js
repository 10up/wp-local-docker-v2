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

const removeNetwork = function() {
    try {
        console.log( "Removing Network" );
        execSync('docker network rm wplocaldocker');
    } catch (ex) {}
};

const startGateway = function() {
    try {
        console.log( "Ensuring global services are running" );
        let globalPath = path.join( rootPath, 'global' );
        execSync( `cd ${globalPath} && docker-compose up -d` );
    } catch ( ex ) {}
};

const stopGateway = function() {
    try {
        console.log( "Stopping global services" );
        let globalPath = path.join( rootPath, 'global' );
        execSync( `cd ${globalPath} && docker-compose down` );
    } catch ( ex ) {}
};

const startGlobal = function() {
    ensureNetworkExists();
    startGateway();
};

const stopGlobal = function() {
    stopGateway();
    removeNetwork();
};

const getPathOrError = function( env ) {
    console.log( "Locating project files for " + env );

    let envSlug = slugify( env );
    let envPath = path.join( sitePath, envSlug );
    if ( ! fs.pathExistsSync( envPath ) ) {
        console.error( `ERROR: Cannot find ${env} site!` );
        exit(1);
    }

    return envPath;
};

const getAllEnvironments = function() {
    const isDirectory = source => fs.lstatSync(source).isDirectory();

    const dirs = fs.readdirSync( sitePath )
        .map(name => path.join(sitePath, name))
        .filter(isDirectory)
        .map(name => path.basename( name ) );

    return dirs;
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

const startAll = function() {
    startGlobal();
    getAllEnvironments().map( env => start(env) );
};

const stopAll = function() {
    getAllEnvironments().map( env => stop(env) );
    stopGlobal();
};

module.exports = { startGlobal, stopGlobal, start, stop, startAll, stopAll };
