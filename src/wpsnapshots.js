const fs = require( 'fs-extra' );
const path = require( 'path' );
const execSync = require('child_process').execSync;
const envUtils = require('./env-utils');

const snapshots = function() {
    // Except for a few whitelisted commands, enforce a configuration before proceeding
    // probably need to figure out which commands need a path vs which just need auth.
    let bypassCommands = [ 'configure', 'help', 'list' ];
    let envPath = false;

    if ( bypassCommands.indexOf( process.argv[3] ) === -1 ) {
        // Verify we have a configuration
        if ( fs.existsSync( path.join( envUtils.globalPath, 'data', 'wpsnapshots', 'config.json' ) ) === false ) {
            console.error( "Error: WP Snapshots does not have a configuration file. Please run '10up-docker wpsnapshots configure' before continuing." );
            process.exit();
        }

        // @todo allow users to specify environment an alternate way
        let envSlug = envUtils.parseEnvFromCWD();
        if ( envSlug === false ) {
            console.error( "Error: Unable to determine which environment to use wp snapshots with. Please run this command from within your environment." );
            process.exit(1);
        }
        envPath = envUtils.envPath( envSlug );
    }

    // Get everything after the snapshots command, so we can pass to the docker container
    let command = Array.prototype.slice.call( process.argv, 3 ).join( ' ' );

    // @todo update the image version once new images are merged
    if ( envPath === false ) {
        execSync( `docker run -it --rm --network wplocaldocker -v ${envUtils.globalPath}/data/wpsnapshots:/home/wpsnapshots/.wpsnapshots 10up/wpsnapshots:dev ${command}`, { stdio: 'inherit' });
    } else {
        execSync( `docker run -it --rm --network wplocaldocker -v ${envPath}/wordpress:/var/www/html -v ${envUtils.globalPath}/data/wpsnapshots:/home/wpsnapshots/.wpsnapshots 10up/wpsnapshots:dev ${command}`, { stdio: 'inherit' });
    }
};

module.exports = { snapshots };
