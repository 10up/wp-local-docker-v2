const path = require('path');
const fs = require( 'fs-extra' );
const slugify = require('@sindresorhus/slugify');
const execSync = require('child_process').execSync;
const prompt = require( 'prompt' );
const promptValidators = require( './prompt-validators' );

// Setup some paths for reference later
const rootPath = path.dirname( require.main.filename );
const sitePath = path.join( rootPath, 'sites' );

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

const startGateway = function() {
    console.log( "Ensuring global services are running" );
    let globalPath = path.join( rootPath, 'global' );
    execSync( `cd ${globalPath} && docker-compose up -d` );
    console.log();
};

const stopGateway = function() {
    console.log( "Stopping global services" );
    let globalPath = path.join( rootPath, 'global' );
    execSync( `cd ${globalPath} && docker-compose down` );
    console.log();
};

const restartGateway = function() {
    console.log( "Restarting global services" );
    let globalPath = path.join( rootPath, 'global' );
    execSync( `cd ${globalPath} && docker-compose restart` );
    console.log();
};

const startGlobal = function() {
    ensureNetworkExists();
    startGateway();
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
    console.log( `Locating project files for ${env}` );

    let envSlug = slugify( env );
    let envPath = path.join( sitePath, envSlug );
    if ( ! fs.pathExistsSync( envPath ) ) {
        console.error( `ERROR: Cannot find ${env} site!` );
        exit(1);
    }

    return envPath;
};

const getAllEnvironments = function() {
    const isDirectory = source => fs.lstatSync(source).isDirectory();

    const dirs = fs.readdirSync( sitePath )
        .map(name => path.join(sitePath, name))
        .filter(isDirectory)
        .map(name => path.basename( name ) );

    return dirs;
};

const start = function( env ) {
    startGlobal();
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

        // We at least need to be able to reach the DB in order to clean everything up, so ensure global services are running
        this.startGlobal();
        console.log( 'deleting' );
    });
};

const startAll = function() {
    startGlobal();
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

module.exports = { startGlobal, stopGlobal, start, stop, restart, deleteEnv, startAll, stopAll, restartAll };
