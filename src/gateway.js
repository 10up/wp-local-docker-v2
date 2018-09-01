const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const envUtils = require( './env-utils' );

// Tracks if we've started global inside of this session
let started = false;

const ensureNetworkExists = function() {
    try {
        console.log( "Ensuring global network exists" );
        let networks = execSync( "docker network ls --filter name=wplocaldocker" ).toString();
        if ( networks.indexOf( 'wplocaldocker' ) !== -1 ) {
            console.log( " - Network exists" );
            return;
        }

        console.log( " - Creating network" );
        execSync('docker network create wplocaldocker');
    } catch (ex) {}
};

const removeNetwork = function() {
    try {
        console.log( "Removing Global Network" );
        execSync('docker network rm wplocaldocker');
    } catch (ex) {}
};

const ensureCacheExists = async function() {
    try {
        console.log( "Ensuring global cache volume exists" );
        let volumes = await exec( `docker volume ls --filter name=${envUtils.cacheVolume}` ).toString();
        if ( volumes.indexOf( `${envUtils.cacheVolume}` ) !== -1 ) {
            console.log( " - Volume Exists" );
            return;
        }

        console.log( " - Creating Volume" );
        await exec( `docker volume create ${envUtils.cacheVolume}` );
    }   catch (ex) {}
};

const removeCacheVolume = async function() {
    try {
        console.log( "Removing cache volume" );
        let volumes = await exec( `docker volume ls --filter name=${envUtils.cacheVolume}` ).toString();
        if ( volumes.indexOf( `${envUtils.cacheVolume}` ) === -1 ) {
            await exec( `docker volume rm ${envUtils.cacheVolume}` );
            console.log( " - Volume Removed" );
            return;
        }
    } catch (ex) {}
};

const waitForDB = function() {
    // ready for connections
    return new Promise( resolve => {
        let interval = setInterval(() => {
            console.log( "Waiting for mysql..." );
            let mysql = execSync( `cd ${envUtils.globalPath} && docker-compose logs mysql` ).toString();
            if ( mysql.indexOf( 'ready for connections' ) !== -1 ) {
                clearInterval( interval );
                resolve();
            }
        }, 1000 );
    });
};

const startGateway = async function() {
    console.log( "Ensuring global services are running" );
    execSync( `cd ${envUtils.globalPath} && docker-compose up -d` );
    console.log();

    await waitForDB();
};

const stopGateway = function() {
    console.log( "Stopping global services" );
    execSync( `cd ${envUtils.globalPath} && docker-compose down` );
    console.log();
};

const restartGateway = function() {
    console.log( "Restarting global services" );
    execSync( `cd ${envUtils.globalPath} && docker-compose restart` );
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
