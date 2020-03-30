const { execSync } = require( 'child_process' );
const { exec } = require( 'child_process' );
const envUtils = require( './env-utils' );
const config = require( './configure' );
const fs = require( 'fs' );
const path = require( 'path' );
const nc = require( 'netcat/client' );

// Tracks if we've started global inside of this session
let started = false;

const ensureNetworkExists = function() {
    try {
        console.log( 'Ensuring global network exists' );
        const networks = execSync( 'docker network ls --filter name=^wplocaldocker$' ).toString();
        if ( networks.indexOf( 'wplocaldocker' ) !== -1 ) {
            console.log( ' - Network exists' );
            return;
        }

        console.log( ' - Creating network' );
        // --ip-range is only half of the subnet, so that we have a bunch of addresses in front to assign manually
        execSync( 'docker network create wplocaldocker --subnet=10.0.0.0/16 --gateway 10.0.0.1 --ip-range 10.0.128.0/17' );
    } catch ( ex ) {}
};

const removeNetwork = function() {
    try {
        console.log( 'Removing Global Network' );
        execSync( 'docker network rm wplocaldocker' );
    } catch ( ex ) {}
};

const ensureCacheExists = async function() {
    try {
        console.log( 'Ensuring global cache volume exists' );
        const volumes = await exec( `docker volume ls --filter name=${envUtils.cacheVolume}` ).toString();
        if ( volumes.indexOf( `${envUtils.cacheVolume}` ) !== -1 ) {
            console.log( ' - Volume Exists' );
            return;
        }

        console.log( ' - Creating Volume' );
        await exec( `docker volume create ${envUtils.cacheVolume}` );
    }   catch ( ex ) {}
};

const removeCacheVolume = async function() {
    try {
        console.log( 'Removing cache volume' );
        const volumes = await exec( `docker volume ls --filter name=${envUtils.cacheVolume}` ).toString();
        if ( volumes.indexOf( `${envUtils.cacheVolume}` ) === -1 ) {
            await exec( `docker volume rm ${envUtils.cacheVolume}` );
            console.log( ' - Volume Removed' );
            return;
        }
    } catch ( ex ) {}
};


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

const startGlobal = async function() {
    if ( started === true ) {
        return;
    }
    ensureNetworkExists();
    await ensureCacheExists();
    await startGateway();

    started = true;
};

const stopGlobal = function() {
    stopGateway();
    removeNetwork();

    started = false;
};

const restartGlobal = function() {
    ensureNetworkExists();
    restartGateway();

    started = true;
};

module.exports = { startGlobal, stopGlobal, restartGlobal, removeCacheVolume, ensureCacheExists };
