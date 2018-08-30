const commandUtils = require( './command-utils' );
const fs = require( 'fs-extra' );
const envUtils = require('./env-utils');

// @todo clear wp-snapshots cache. Hoping for alternate directory structure
const help = function() {
    let help = `
Usage: 10up-docker cache clear

Clears npm, wp-cli, and WP Snapshots caches
`;
    console.log( help );
    process.exit();
};

const clear = async function() {
    console.log( "Clearing Cache" );
    await fs.emptyDir( envUtils.cachePath );
    console.log( "Cache Cleared" );
};

const command = async function() {
    switch( commandUtils.subcommand() ) {
        case 'clear':
            await clear();
            break;
        default:
            help();
            break;
    }
};

module.exports = { command, clear };
