const commandUtils = require( './command-utils' );
const path = require('path');
const fs = require( 'fs-extra' );
const execSync = require('child_process').execSync;
const prompt = require( 'prompt' );
const promptValidators = require( './prompt-validators' );
const mysql = require('mysql');
const envUtils = require( './env-utils' );

const help = function() {
    let command = process.argv[2];

    let help = `
Usage:  10up-docker ${command} ENVIRONMENT
        10up-docker ${command} all

${command.charAt(0).toUpperCase()}${command.substr(1)} one or more environments 

ENVIRONMENT can be set to either the slug version of the hostname (same as the directory name) or the hostname.
    - docker.test
    - docker-test

When 'all' is specified as the ENVIRONMENT, each environment will ${command}
`;
    console.log( help );
    process.exit();
};

const ensureNetworkExists = function() {
    try {
        console.log( "Ensuring global network exists" );
        let networks = execSync( "docker network ls --filter name=wplocaldocker" ).toString();
        if ( networks.indexOf( 'wplocaldocker' ) !== -1 ) {
            console.log( " - Network exists" );
            console.log();
            return;
        }

        console.log( " - Creating network" );
        console.log();
        execSync('docker network create wplocaldocker');
    } catch (ex) {}
};

const removeNetwork = function() {
    try {
        console.log( "Removing Global Network" );
        execSync('docker network rm wplocaldocker');
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
    ensureNetworkExists();
    await startGateway();
};

const stopGlobal = function() {
    stopGateway();
    removeNetwork();
};

const restartGlobal = function() {
    ensureNetworkExists();
    restartGateway();
};

const getPathOrError = function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        help();
        process.exit(1);
    }

    console.log( `Locating project files for ${env}` );

    let envPath = envUtils.envPath( env );
    if ( ! fs.pathExistsSync( envPath ) ) {
        console.error( `ERROR: Cannot find ${env} environment!` );
        process.exit(1);
    }

    return envPath;
};

const getAllEnvironments = function() {
    const isDirectory = source => fs.lstatSync(source).isDirectory();

    const dirs = fs.readdirSync( envUtils.sitesPath )
        .map( name => path.join( envUtils.sitesPath, name ) )
        .filter( isDirectory )
        .map( name => path.basename( name ) );

    return dirs;
};

const start = function( env ) {
    let envPath = getPathOrError(env);

    console.log( `Starting docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose up -d` );
    console.log();
};

const stop = function( env ) {
    let envPath = getPathOrError(env);

    console.log( `Stopping docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose down` );
    console.log();
};

const restart = function( env ) {
    let envPath = getPathOrError(env);

    console.log( `Restarting docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose restart` );
    console.log();
};

const deleteEnv = function( env ) {
    let envPath = getPathOrError(env);
    let envSlug = envUtils.envSlug( env );

    prompt.start();

    let prompts = {
        properties: {
            confirmDelete: {
                description: `Are you sure you want to delete the ${env} environment? (Y/n)`,
                message: "You must choose either `Y` or `n`",
                type: 'string',
                required: true,
                default: 'n',
                enum: [ 'Y', 'y', 'N', 'n' ],
                before: promptValidators.validateBool,
            }
        }
    };

    prompt.get( prompts, function( err, result ) {
        if ( err ) {
            console.log( '' );
            process.exit();
        }

        if ( result.confirmDelete !== 'true' ) {
            return;
        }

        // Stop the current environment if it is running
        stop(env);

        console.log( "Deleting Files" );
        fs.removeSync( envPath );
        console.log();

        console.log( 'Deleting Database' );
        // @todo clean up/abstract to a database file
        let connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'password',
        });

        connection.query( `DROP DATABASE IF EXISTS \`${envSlug}\`;`, function( err, results ) {
            if (err) {
                console.log('error in creating database', err);
                process.exit();
                return;
            }

            connection.destroy();
        } );
    });
};

const startAll = function() {
    getAllEnvironments().map( env => start(env) );
};

const stopAll = function() {
    getAllEnvironments().map( env => stop(env) );
    stopGlobal();
};

const restartAll = function() {
    getAllEnvironments().map( env => restart(env) );
    restartGlobal();
};

const command = async function() {
    switch ( commandUtils.command() ) {
        case 'start':
            await startGlobal();
            commandUtils.subcommand() === 'all' ? startAll() : start( commandUtils.commandArgs() );
            break;
        case 'stop':
            commandUtils.subcommand() === 'all' ? stopAll() : stop( commandUtils.commandArgs() );
            break;
        case 'restart':
            await startGlobal();
            commandUtils.subcommand() === 'all' ? restartAll() : restart( commandUtils.commandArgs() );
            break;
        case 'delete':
            await startGlobal();
            deleteEnv( commandUtils.commandArgs() );
            break;
        default:
            help();
            break;
    }
};

module.exports = { command, startGlobal, stopGlobal, start, stop, restart, deleteEnv, startAll, stopAll, restartAll, help };
