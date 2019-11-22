const execSync = require('child_process').execSync;
const envUtils = require( './env-utils' );
const path = require( 'path' );
const checkForUpdate = require('update-check');
const chalk = require( 'chalk' );
const shellEscape = require( 'shell-escape' );

const command = function() {
    let command = process.argv[2];
    if ( typeof command === "undefined" ) {
        return;
    }

    return process.argv[2].toLowerCase();
};

const commandArgs = function() {
    return shellEscape( Array.prototype.slice.call( process.argv, 3 ) );
};

const subcommand = function() {
    let subcommand = process.argv[3];

    if ( typeof subcommand !== 'undefined' ) {
        return process.argv[3].toLowerCase();
    }

    return;
};

const getArg = function( number ) {
    // +2 for the path to node, and the "10updocker" main arg/command
    let arg = process.argv[ number + 2 ];
    if ( typeof arg === "undefined" ) {
        return;
    }

    return arg;
};

const checkIfDockerRunning = function() {
    var output;

    try {
        output = execSync( 'docker system info' );
    } catch (er) {
        return false;
    }

    if ( output.toString().toLowerCase().indexOf( 'version') === -1 ) {
        return false;
    }

    return true;
};

const checkForUpdates = async function() {
    let pkg = require( path.join( envUtils.rootPath, 'package' ) );
    let update = null;

    try {
        update = await checkForUpdate(pkg);
    } catch (err) {
        console.error( chalk.yellow( `Failed to automatically check for updates. Please ensure WP Local Docker is up to date.` ) );
    }

    if ( update ) {
        console.warn( chalk.yellow( `WP Local Docker version ${update.latest} is now available. Please run \`npm update -g wp-local-docker\` to update!` ) );
    }
};

module.exports = { command, commandArgs, subcommand, getArg, checkIfDockerRunning, checkForUpdates };
