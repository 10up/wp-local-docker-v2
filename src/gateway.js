const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const envUtils = require( './env-utils' );

// Tracks if we've started global inside of this session
let started = false;

const ensureNetworkExists = function() {
    try {
        console.log( "Ensuring global network exists" );
        let networks = execSync( "docker network ls --filter name=^wplocaldocker$" ).toString();
        if ( networks.indexOf( 'wplocaldocker' ) !== -1 ) {
            console.log( " - Network exists" );
            return;
        }

        console.log( " - Creating network" );
        // --ip-range is only half of the subnet, so that we have a bunch of addresses in front to assign manually
        execSync('docker network create wplocaldocker --subnet=10.0.0.0/16 --gateway 10.0.0.1 --ip-range 10.0.128.0/17');
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

const occurrences = function(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
};

/**
 * Wait for mysql to come up and finish initializing.
 *
 * The first the time the container starts, it will restart, so wait for 2 occurrences of the "ready for connections" string
 * Otherwise, we just wait for one occurrence.
 */
const waitForDB = function() {
    let firstTimeMatch = 'Initializing database';
    let readyMatch = 'ready for connections';
    return new Promise( resolve => {
        let interval = setInterval(() => {
            console.log( "Waiting for mysql..." );
            // FIXME: Only tailing on the logs is bad, we should ping instead
            // Using tail to prevent an edge case where things hang due to large
            // number of logs
            let mysql = execSync( `docker-compose logs --tail 50 mysql`, { cwd: envUtils.globalPath } ).toString();

            if ( mysql.indexOf( readyMatch ) !== -1 ) {
                if ( occurrences( mysql, firstTimeMatch, false ) !== 0 ) {
                    // this is the first time the DB is starting, so it will restart.. Wait for TWO occurrences of connection string
                    if ( occurrences( mysql, readyMatch, false ) < 2 ) {
                        return;
                    }
                } else {
                    if ( occurrences( mysql, readyMatch, false ) < 1 ) {
                        return;
                    }
                }

                clearInterval( interval );
                resolve();
            }
        }, 1000 );
    });
};

const startGateway = async function() {
    console.log( "Ensuring global services are running" );
    execSync( `docker-compose up -d`, { stdio: 'inherit', cwd: envUtils.globalPath });

    await waitForDB();
    console.log();
};

const stopGateway = function() {
    console.log( "Stopping global services" );
    execSync( `docker-compose down`, { stdio: 'inherit', cwd: envUtils.globalPath });
    console.log();
};

const restartGateway = function() {
    console.log( "Restarting global services" );
    execSync( `docker-compose restart`, { stdio: 'inherit', cwd: envUtils.globalPath });
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
