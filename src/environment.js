const commandUtils = require( './command-utils' );
const path = require('path');
const fs = require( 'fs-extra' );
const execSync = require('child_process').execSync;
const prompt = require( 'prompt' );
const promptValidators = require( './prompt-validators' );
const mysql = require('mysql');
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );

const help = function() {
    let command = commandUtils.command();

    let help = `
Usage:  10updocker ${command} ENVIRONMENT
        10updocker ${command} all

${command.charAt(0).toUpperCase()}${command.substr(1)} one or more environments 

ENVIRONMENT can be set to either the slug version of the hostname (same as the directory name) or the hostname.
    - docker.test
    - docker-test

When 'all' is specified as the ENVIRONMENT, each environment will ${command}
`;
    console.log( help );
    process.exit();
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
        help();
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

const start = async function( env ) {
    let envPath = getPathOrError(env);

    await gateway.startGlobal();

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

const restart = async function( env ) {
    let envPath = getPathOrError(env);

    await gateway.startGlobal();

    console.log( `Restarting docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose restart` );
    console.log();
};

const deleteEnv = async function( env ) {
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

    prompt.get( prompts, async function( err, result ) {
        if ( err ) {
            console.log( '' );
            process.exit();
        }

        if ( result.confirmDelete !== 'true' ) {
            return;
        }

        await gateway.startGlobal();

        // Stop the environment, and ensure volumes are deleted with it
        let envPath = getPathOrError(env);
        execSync( `cd ${envPath} && docker-compose down -v` );
        console.log();


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
    gateway.stopGlobal();
};

const restartAll = function() {
    getAllEnvironments().map( env => restart(env) );
    gateway.restartGlobal();
};

const command = async function() {
    if ( commandUtils.subcommand() === 'help' || commandUtils.subcommand() === false ) {
        help();
    } else {
        switch ( commandUtils.command() ) {
            case 'start':
                commandUtils.subcommand() === 'all' ? startAll() : start( commandUtils.commandArgs() );
                break;
            case 'stop':
                commandUtils.subcommand() === 'all' ? stopAll() : stop( commandUtils.commandArgs() );
                break;
            case 'restart':
                commandUtils.subcommand() === 'all' ? restartAll() : restart( commandUtils.commandArgs() );
                break;
            case 'delete':
                deleteEnv( commandUtils.commandArgs() );
                break;
            default:
                help();
                break;
        }
    }
};

module.exports = { command, start, stop, restart, help };
