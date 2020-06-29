const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const nc = require( 'netcat/client' );

const makeDocker = require( './utils/make-docker' );
const envUtils = require( './env-utils' );
const config = require( './configure' );

// Tracks if we've started global inside of this session
let started = false;

async function ensureNetworkExists( docker ) {
    console.log( 'Ensuring global network exists' );

    const networkName = 'wplocaldocker';

    const network = docker.getNetwork( networkName );
    const data = await network.inspect().catch( () => false );
    if ( data ) {
        console.log( ' - Network exists' );
        return;
    }

    console.log( ' - Creating network' );
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
}

const removeNetwork = function() {
    try {
        console.log( 'Removing Global Network' );
        execSync( 'docker network rm wplocaldocker' );
    } catch ( ex ) {}
};

async function ensureCacheExists( docker ) {
    console.log( 'Ensuring global cache volume exists' );

    const volume = await docker.getVolume( envUtils.cacheVolume );
    const data = await volume.inspect().catch( () => false );

    if ( data ) {
        console.log( ' - Volume Exists' );
    } else {
        console.log( ' - Creating Volume' );
        docker.createVolume( {
            Name: envUtils.cacheVolume,
        } );    
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
const waitForDB = function() {
    return new Promise( resolve => {
        const interval = setInterval( () => {
            const netcat = new nc();
            netcat.address( '127.0.0.1' );
            netcat.port( 3306 );
            console.log( 'Waiting for mysql...' );
            netcat.connect();
            netcat.on( 'data', function(  ) {
                netcat.close();
                clearInterval( interval );
                resolve();
            } );
        }, 1000 );
    } );
};

const startGateway = async function() {
    console.log( 'Ensuring global services are running' );

    if ( fs.existsSync( path.join( config.getConfigDirectory(), 'global' ) ) ) {
        execSync( 'docker-compose up -d', { stdio: 'inherit', cwd: path.join( config.getConfigDirectory(), 'global' ) } );
    }
    else {
        // backwards compat in case they have an existing install but haven't run configure recently
        execSync( 'docker-compose up -d', { stdio: 'inherit', cwd: envUtils.globalPath } );
    }

    await waitForDB();
    console.log();
};

const stopGateway = function() {
    console.log( 'Stopping global services' );
    execSync( 'docker-compose down', { stdio: 'inherit', cwd: envUtils.globalPath } );
    console.log();
};

const restartGateway = function() {
    console.log( 'Restarting global services' );
    execSync( 'docker-compose restart', { stdio: 'inherit', cwd: envUtils.globalPath } );
    console.log();
};

async function startGlobal() {
    if ( started === true ) {
        return;
    }

    const docker = makeDocker();

    await ensureNetworkExists( docker );
    await ensureCacheExists( docker );
    await startGateway();

    started = true;
}

const stopGlobal = function() {
    stopGateway();
    removeNetwork();

    started = false;
};

async function restartGlobal() {
    const docker = makeDocker();

    await ensureNetworkExists( docker );
    restartGateway();

    started = true;
}

module.exports = { startGlobal, stopGlobal, restartGlobal, removeCacheVolume, ensureCacheExists };
