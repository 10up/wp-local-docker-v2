const commandUtils = require( './command-utils' );
const path = require('path');
const fs = require( 'fs-extra' );
const execSync = require('child_process').execSync;
const prompt = require( 'prompt' );
const promptValidators = require( './prompt-validators' );
const mysql = require('mysql');
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const sudo = require( 'sudo-prompt' );

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
    const isDirectory = source => fs.lstatSync(source).isDirectory();

    let sitesPath = await envUtils.sitesPath();
    const dirs = fs.readdirSync( sitesPath )
        .map( name => path.join( sitesPath, name ) )
        .filter( isDirectory )
        .map( name => path.basename( name ) );

    return dirs;
};

const start = async function( env ) {
    let envPath = await getPathOrError(env);

    await gateway.startGlobal();

    console.log( `Starting docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose up -d`, { stdio: 'inherit' });
    console.log();
};

const stop = async function( env ) {
    let envPath = await getPathOrError(env);

    console.log( `Stopping docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose down`, { stdio: 'inherit' });
    console.log();
};

const restart = async function( env ) {
    let envPath = await getPathOrError(env);

    await gateway.startGlobal();

    console.log( `Restarting docker containers for ${env}` );
    execSync( `cd ${envPath} && docker-compose restart`, { stdio: 'inherit' });
    console.log();
};

const deleteEnv = async function( env ) {
    let envPath = await getPathOrError(env);
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
        console.log( "Deleting containers" );
        try {
            execSync( `cd ${envPath} && docker-compose down -v`, { stdio: 'inherit' });
        } catch (ex) {
            // If the docker-compose file is already gone, this happens
        }

        console.log( "Removing host file entries" );
        let envConfig = await fs.readJson( path.join( envPath, '.config.json' ));

        let sudoOptions = {
            name: "WP Local Docker Generator"
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

        console.log( "Deleting Files" );
        await fs.remove( envPath );

        console.log( 'Deleting Database' );
        // @todo clean up/abstract to a database file
        let connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'password',
        });

        await connection.query( `DROP DATABASE IF EXISTS \`${envSlug}\`;`, function( err, results ) {
            if (err) {
                console.log('error deleting database', err);
                process.exit();
                return;
            }

            connection.destroy();
        } );
    });
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
                deleteEnv( commandUtils.commandArgs() );
                break;
            default:
                help();
                break;
        }
    }
};

module.exports = { command, start, stop, restart, help };
