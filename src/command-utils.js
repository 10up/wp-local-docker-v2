const { execSync } = require( 'child_process' );
const envUtils = require( './env-utils' );
const path = require( 'path' );
const checkForUpdate = require( 'update-check' );
const chalk = require( 'chalk' );
const shellEscape = require( 'shell-escape' );

const command = function() {
    const command = process.argv[2];
    if ( typeof command === 'undefined' ) {
        return;
    }

    return process.argv[2].toLowerCase();
};

/**
 * Get the command args, maybe shell escaping them. Set false for no escape.
 * @param bool escape 
 * @returns string
 */
const commandArgs = function( escape = true ) {
    return ( escape ) ? 
        shellEscape( Array.prototype.slice.call( process.argv, 3 ) ) : 
        Array.prototype.slice.call( process.argv, 3 );
};

const subcommand = function() {
    const subcommand = process.argv[3];

    if ( typeof subcommand !== 'undefined' ) {
        return process.argv[3].toLowerCase();
    }

    return;
};

const getArg = function( number ) {
    // +2 for the path to node, and the "10updocker" main arg/command
    const arg = process.argv[ number + 2 ];
    if ( typeof arg === 'undefined' ) {
        return;
    }

    return arg;
};

const checkIfDockerRunning = function() {
    let output;

    try {
        output = execSync( 'docker system info' );
    } catch ( er ) {
        return false;
    }

    if ( output.toString().toLowerCase().indexOf( 'version' ) === -1 ) {
        return false;
    }

    return true;
};

const checkForUpdates = async function() {
    const pkg = require( path.join( envUtils.rootPath, 'package' ) );
    let update = null;

    try {
        update = await checkForUpdate( pkg );
    } catch ( err ) {
        console.error( chalk.yellow( 'Failed to automatically check for updates. Please ensure WP Local Docker is up to date.' ) );
    }

    if ( update ) {
        console.warn( chalk.yellow( `WP Local Docker version ${update.latest} is now available. Please run \`npm update -g wp-local-docker\` to update!` ) );
    }
};

module.exports = { command, commandArgs, subcommand, getArg, checkIfDockerRunning, checkForUpdates };
