const commandUtils = require( './command-utils' );
const path = require('path');
const fs = require( 'fs-extra' );
const execSync = require('child_process').execSync;
const inquirer = require( 'inquirer' );
const promptValidators = require( './prompt-validators' );
const database = require( './database' );
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const sudo = require( 'sudo-prompt' );
const async = require( 'asyncro' );

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

const getPathOrError = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        help();
        process.exit(1);
    }

    console.log( `Locating project files for ${env}` );

    let envPath = await envUtils.envPath( env );
    if ( ! await fs.pathExists( envPath ) ) {
        console.error( `ERROR: Cannot find ${env} environment!` );
        help();
        process.exit(1);
    }

    return envPath;
};

const getAllEnvironments = async function() {
    let sitesPath = await envUtils.sitesPath();
    let dirContent = await fs.readdir( sitesPath );

    // Filter any "hidden" directories
    dirContent = await async.filter( dirContent, async item => {
        return item.indexOf( '.' ) === 0 ? false : true;
    });

    // Make into full path
    dirContent = await async.map( dirContent, async item => {
        return path.join( sitesPath, item );
    });

    // Filter any that aren't directories
    dirContent = await async.filter( dirContent, async item => {
        let stat = await fs.stat( item );
        return stat.isDirectory();
    });

    // Back to just the basename
    dirContent = await async.map( dirContent, async item => {
        return path.basename( item );
    });

    return dirContent;
};

const start = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    let envPath = await getPathOrError(env);

    await gateway.startGlobal();

    console.log( `Starting docker containers for ${env}` );
    try {
        execSync( `cd ${envPath} && docker-compose up -d`, { stdio: 'inherit' });
    } catch (ex) {}
    console.log();
};

const stop = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    let envPath = await getPathOrError(env);

    console.log( `Stopping docker containers for ${env}` );
    try {
        execSync( `cd ${envPath} && docker-compose down`, { stdio: 'inherit' });
    } catch (ex) {}
    console.log();
};

const restart = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    let envPath = await getPathOrError(env);

    await gateway.startGlobal();

    console.log( `Restarting docker containers for ${env}` );
    try {
        execSync( `cd ${envPath} && docker-compose restart`, { stdio: 'inherit' });
    } catch (ex) {
        // Usually because the environment isn't running
    }
    console.log();
};

const deleteEnv = async function( env ) {
    let envPath = await getPathOrError(env);
    let envSlug = envUtils.envSlug( env );

    let answers = await inquirer.prompt({
        name: 'confirm',
        type: 'confirm',
        message: `Are you sure you want to delete the ${env} environment`,
        validate: promptValidators.validateNotEmpty,
        default: false,
    });

    if ( answers.confirm === false ) {
        return;
    }

    await gateway.startGlobal();

    // Stop the environment, and ensure volumes are deleted with it
    console.log( "Deleting containers" );
    try {
        execSync( `cd ${envPath} && docker-compose down -v`, { stdio: 'inherit' });
    } catch (ex) {
        // If the docker-compose file is already gone, this happens
    }

    try {
        console.log( "Removing host file entries" );
        let envConfig = await fs.readJson( path.join( envPath, '.config.json' ));

        let sudoOptions = {
            name: "WP Local Docker"
        };

        for ( let i = 0, len = envConfig.envHosts.length; i < len; i++ ) {
            let envHost = envConfig.envHosts[ i ];
            await new Promise( resolve => {
                console.log( ` - Removing ${envHost}` );
                sudo.exec(`10updocker-hosts remove ${envHost}`, sudoOptions, function (error, stdout, stderr) {
                    if (error) throw error;
                    console.log(stdout);
                    resolve();
                });
            });
        }
    } catch (err) {
        console.error( "Error: Something went wrong deleting host file entries. There may still be remnants in /etc/hosts" );
    }

    console.log( "Deleting Files" );
    await fs.remove( envPath );

    console.log( 'Deleting Database' );
    await database.deleteDatabase( envSlug );
};

const startAll = async function() {
    let envs = await getAllEnvironments();

    await gateway.startGlobal();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await start( envs[i] );
    }
};

const stopAll = async function() {
    let envs = await getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await stop( envs[ i ] );
    }

    gateway.stopGlobal();
};

const restartAll = async function() {
    let envs = await getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await restart( envs[ i ] );
    }

    gateway.restartGlobal();
};

const deleteAll = async function() {
    let envs = await getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await deleteEnv( envs[ i ] );
    }
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
            case 'remove':
                commandUtils.subcommand() === 'all' ? deleteAll() : deleteEnv( commandUtils.commandArgs() );
                break;
            default:
                help();
                break;
        }
    }
};

module.exports = { command, start, stop, restart, help };
