const path = require( 'path' );
const fs = require( 'fs-extra' );
const commandUtils = require( './command-utils' );
const gateway = require( './gateway' );
const config = require( './configure' );
const async = require( 'asyncro' );

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

    let wpsnapshotsDir = path.join( config.getConfigDirectory(), 'wpsnapshots' );
    let snapDirContent = await fs.readdir( wpsnapshotsDir );

    // Filter to only directories. Makes sure we don't delete the config
    snapDirContent = await async.filter( snapDirContent, async item => {
        let testPath = path.join( wpsnapshotsDir, item );
        let stat = await fs.stat( testPath );

        return stat.isDirectory();
    });

    await async.map( snapDirContent, async item => {
        await fs.remove( path.join( wpsnapshotsDir, item ) );
    });

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
