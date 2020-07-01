const fs = require( 'fs' );
const path = require( 'path' );

const nc = require( 'netcat/client' );

const makeDocker = require( './utils/make-docker' );
const makeCompose = require( './utils/make-compose' );

const envUtils = require( './env-utils' );
const config = require( './configure' );

// Tracks if we've started global inside of this session
let started = false;

async function ensureNetworkExists( docker, spinner ) {
    if ( spinner ) {
        spinner.start( 'Ensuring global network exists...' );
    } else {
        console.log( 'Ensuring global network exists' );
    }

    const networkName = 'wplocaldocker';

    const network = docker.getNetwork( networkName );
    const data = await network.inspect().catch( () => false );
    if ( data ) {
        if ( spinner ) {
            spinner.succeed( 'Global network exists...' );
        } else {
            console.log( ' - Network exists' );
        }
        return;
    }

    if ( spinner ) {
        spinner.warn( 'Global network doesn\'t exist...' );
        spinner.start( 'Creating global network...' );
    } else {
        console.log( ' - Creating network' );
    }

    // --ip-range is only half of the subnet, so that we have a bunch of addresses in front to assign manually
    await docker.createNetwork( {
        Name: networkName,
        IPAM: {
            Driver: 'default',
            Config: [
                {
                    Subnet: '10.0.0.0/16',
                    IPRange: '10.0.128.0/17',
                    Gateway: '10.0.0.1',
                },
            ],
        },
    } );

    if ( spinner ) {
        spinner.succeed( 'Global network created...' );
    }
}

async function removeNetwork( docker ) {
    console.log( 'Removing Global Network' );

    const network = docker.getNetwork( 'wplocaldocker' );
    const data = await network.inspect().catch( () => false );
    if ( data ) {
        await network.remove();
        console.log( ' - Network Removed' );
        return;
    }
}

async function ensureCacheExists( docker, spinner ) {
    if ( spinner ) {
        spinner.start( 'Ensuring global cache volume exists...' );
    } else {
        console.log( 'Ensuring global cache volume exists' );
    }

    const volume = await docker.getVolume( envUtils.cacheVolume );
    const data = await volume.inspect().catch( () => false );

    if ( data ) {
        if ( spinner ) {
            spinner.succeed( 'Global cache volume exists...' );
        } else {
            console.log( ' - Volume Exists' );
        }
    } else {
        if ( spinner ) {
            spinner.warn( 'Global cache volume doesn\'t exist...' );
            spinner.start( 'Creating global cache volume...' );
        } else {
            console.log( ' - Creating Volume' );
        }

        await docker.createVolume( {
            Name: envUtils.cacheVolume,
        } );

        if ( spinner ) {
            spinner.succeed( 'Global cache volume created...' );
        }
    }
}

async function removeCacheVolume( docker ) {
    console.log( 'Removing cache volume' );

    const volume = await docker.getVolume( envUtils.cacheVolume );
    const data = await volume.inspect().catch( () => false );

    if ( data ) {
        await volume.remove();
        console.log( ' - Volume Removed' );
    }
}

/**
 * Wait for mysql to come up and finish initializing.
 *
 * The first the time the MySQL container starts it will initialize the data directory. It will open port 3306
 * but not send data back when connected to, instead closing the connection immediately. netcat is used
 * here to connect the the MySQL port and will resolve the promise once MySQL sends data back indicating
 * MySQL is ready for work.
 */
function waitForDB( spinner ) {
    if ( spinner ) {
        spinner.start( 'Waiting for mysql...' );
    } else {
        console.log( 'Waiting for mysql...' );
    }

    return new Promise( ( resolve ) => {
        const interval = setInterval( () => {
            const netcat = new nc();

            netcat.address( '127.0.0.1' );
            netcat.port( 3306 );
            netcat.connect();
            netcat.on( 'data', function(  ) {
                netcat.close();

                if ( spinner ) {
                    spinner.succeed( 'Mysql has started...' );
                }

                clearInterval( interval );
                resolve();
            } );
        }, 1000 );
    } );
}

async function startGateway( spinner ) {
    let cwd = path.join( config.getConfigDirectory(), 'global' );
    if ( ! fs.existsSync( cwd ) ) {
        cwd = envUtils.globalPath;
    }

    if ( spinner ) {
        spinner.start( 'Ensuring global services are running...' );
    } else {
        console.log( 'Ensuring global services are running' );
    }

    await makeCompose().upAll( {
        cwd,
        log: false,
    } );

    if ( spinner ) {
        spinner.succeed( 'Global services are running...' );
    }

    await waitForDB( spinner );
}

async function stopGateway() {
    console.log( 'Stopping global services' );

    await makeCompose().down( {
        cwd: envUtils.globalPath,
        log: true,
    } );

    console.log();
}

async function restartGateway() {
    console.log( 'Restarting global services' );

    await makeCompose().down( {
        cwd: envUtils.globalPath,
        log: true,
    } );

    console.log();
}

async function startGlobal( spinner ) {
    if ( started === true ) {
        return;
    }

    const docker = makeDocker();

    await ensureNetworkExists( docker, spinner );
    await ensureCacheExists( docker, spinner );
    await startGateway( spinner );

    started = true;
}

async function stopGlobal() {
    const docker = makeDocker();

    await stopGateway();
    await removeNetwork( docker );

    started = false;
}

async function restartGlobal() {
    const docker = makeDocker();

    await ensureNetworkExists( docker );
    await restartGateway();

    started = true;
}

module.exports = {
    startGlobal,
    stopGlobal,
    restartGlobal,
    removeCacheVolume,
    ensureCacheExists,
};
