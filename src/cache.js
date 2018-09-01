const commandUtils = require( './command-utils' );
const gateway = require( './gateway' );

// @todo clear wp-snapshots cache. Hoping for alternate directory structure
const help = function() {
    let help = `
Usage: 10updocker cache clear

Clears npm, wp-cli, and WP Snapshots caches
`;
    console.log( help );
    process.exit();
};

const clear = async function() {
    await gateway.removeCacheVolume();
    await gateway.ensureCacheExists();
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
