const commandUtils = require( './command-utils' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const execSync = require('child_process').execSync;
const envUtils = require('./env-utils');

const command = async function() {
    // false catches the case when no subcommand is passed, and we just pass to snapshots to show usage
    let bypassCommands = [ false, 'configure', 'help', 'list' ];
    let noPathCommands = [ false, 'configure', 'help', 'list', 'delete', 'search', 'download' ];
    let envPath = false;

    // Except for a few whitelisted commands, enforce a configuration before proceeding
    if ( bypassCommands.indexOf( commandUtils.subcommand() ) === -1 ) {
        // Verify we have a configuration
        if ( fs.existsSync( path.join( envUtils.globalPath, 'data', 'wpsnapshots', 'config.json' ) ) === false ) {
            console.error( "Error: WP Snapshots does not have a configuration file. Please run '10up-docker wpsnapshots configure' before continuing." );
            process.exit();
        }
    }

    // These commands can be run without being in the context of a WP install
    if ( noPathCommands.indexOf( commandUtils.subcommand() ) === -1 ) {
        // @todo allow users to specify environment an alternate way
        let envSlug = envUtils.parseEnvFromCWD();
        if ( envSlug === false ) {
            console.error( "Error: Unable to determine which environment to use wp snapshots with. Please run this command from within your environment." );
            process.exit(1);
        }
        envPath = envUtils.envPath( envSlug );
    }

    // Get everything after the snapshots command, so we can pass to the docker container
    let command = commandUtils.commandArgs();

    // @todo update the image version once new images are merged
    try{
        if ( envPath === false ) {
            execSync( `docker run -it --rm -v ${envUtils.globalPath}/data/wpsnapshots:/home/wpsnapshots/.wpsnapshots 10up/wpsnapshots:dev ${command}`, { stdio: 'inherit' });
        } else {
            execSync( `docker run -it --rm --network wplocaldocker -v ${envPath}/wordpress:/var/www/html -v ${envUtils.globalPath}/data/wpsnapshots:/home/wpsnapshots/.wpsnapshots 10up/wpsnapshots:dev ${command}`, { stdio: 'inherit' });
        }
    } catch (ex) {}
};

module.exports = { command };
