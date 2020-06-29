const commandUtils = require( './command-utils' );
const gateway = require( './gateway' );
const makeDocker = require( './utils/make-docker' );

const help = function() {
    const help = `
Usage: 10updocker cache clear

Clears npm, wp-cli, and WP Snapshots caches
`;
    console.log( help );
    process.exit();
};

async function clear() {
    const docker = makeDocker();

    await gateway.removeCacheVolume( docker );
    await gateway.ensureCacheExists( docker );

    console.log( 'Cache Cleared' );
}

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
