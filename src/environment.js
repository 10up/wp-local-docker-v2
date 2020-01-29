const commandUtils = require( './command-utils' );
const path = require( 'path' );
const fs = require( 'fs-extra' );
const { execSync } = require( 'child_process' );
const inquirer = require( 'inquirer' );
const promptValidators = require( './prompt-validators' );
const database = require( './database' );
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const sudo = require( 'sudo-prompt' );
const config = require( './configure' );
const chalk = require( 'chalk' );
const readYaml = require( 'read-yaml' );
const os = require( 'os' );
const writeYaml = require( 'write-yaml' );
const { images } = require( './image' );

const help = function() {
    const command = commandUtils.command();

    const help = `
Usage:  10updocker ${command} ENVIRONMENT
        10updocker ${command} all

${command.charAt( 0 ).toUpperCase()}${command.substr( 1 )} one or more environments

ENVIRONMENT can be set to either the slug version of the hostname (same as the directory name) or the hostname.
    - docker.test
    - docker-test

When 'all' is specified as the ENVIRONMENT, each environment will ${command}
`;
    console.log( help );
    process.exit();
};

const start = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if ( env === false || undefined === env || env.trim().length === 0 ) {
        env = await envUtils.promptEnv();
    }

    const envPath = await envUtils.getPathOrError( env );

    // If we got the path from the cwd, we don't have a slug yet, so get it
    const envSlug = envUtils.envSlug( env );

    await gateway.startGlobal();

    console.log( `Starting docker containers for ${envSlug}` );
    try {
        execSync( 'docker-compose up -d', { stdio: 'inherit', cwd: envPath } );
    } catch ( ex ) {}

    const envHosts = await envUtils.getEnvHosts( envPath );
    if ( envHosts.length > 0 ) {
        console.log();
        console.log( 'Environment configured for the following domains:' );
        for ( let i = 0, len = envHosts.length; i < len; i++ ) {
            console.log( envHosts[ i ] );
        }
    }

    console.log();
};

const stop = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if ( env === false || undefined === env || env.trim().length === 0 ) {
        env = await envUtils.promptEnv();
    }

    const envPath = await envUtils.getPathOrError( env );

    // If we got the path from the cwd, we don't have a slug yet, so get it
    const envSlug = envUtils.envSlug( env );

    console.log( `Stopping docker containers for ${envSlug}` );
    try {
        execSync( 'docker-compose down', { stdio: 'inherit', cwd: envPath } );
    } catch ( ex ) {}
    console.log();
};

const restart = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if ( env === false || undefined === env || env.trim().length === 0 ) {
        env = await envUtils.promptEnv();
    }

    const envPath = await envUtils.getPathOrError( env );

    // If we got the path from the cwd, we don't have a slug yet, so get it
    const envSlug = envUtils.envSlug( env );

    await gateway.startGlobal();

    console.log( `Restarting docker containers for ${envSlug}` );
    try {
        execSync( 'docker-compose restart', { stdio: 'inherit', cwd: envPath } );
    } catch ( ex ) {
        // Usually because the environment isn't running
    }
    console.log();
};

const deleteEnv = async function( env ) {
    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if ( env === false || undefined === env || env.trim().length === 0 ) {
        env = await envUtils.promptEnv();
    }

    const envPath = await envUtils.getPathOrError( env );
    const envSlug = envUtils.envSlug( env );

    const answers = await inquirer.prompt( {
        name: 'confirm',
        type: 'confirm',
        message: `Are you sure you want to delete the ${envSlug} environment`,
        validate: promptValidators.validateNotEmpty,
        default: false,
    } );

    if ( answers.confirm === false ) {
        return;
    }

    await gateway.startGlobal();

    // Stop the environment, and ensure volumes are deleted with it
    console.log( 'Deleting containers' );
    try {
        execSync( 'docker-compose down -v', { stdio: 'inherit', cwd: envPath } );
    } catch ( ex ) {
        // If the docker-compose file is already gone, this happens
    }

    if ( await config.get( 'manageHosts' ) === true ) {
        try {
            console.log( 'Removing host file entries' );

            const sudoOptions = {
                name: 'WP Local Docker'
            };

            const envHosts = await envUtils.getEnvHosts( envPath );
            for ( let i = 0, len = envHosts.length; i < len; i++ ) {
                await new Promise( resolve => {
                    console.log( ` - Removing ${envHosts}` );
                    sudo.exec( `10updocker-hosts remove ${envHosts}`, sudoOptions, function ( error, stdout ) {
                        if ( error ) {
                            console.error( `${ chalk.bold.yellow( 'Warning: ' ) }Something went wrong deleting host file entries. There may still be remnants in /etc/hosts` );
                            resolve();
                            return;
                        }
                        console.log( stdout );
                        resolve();
                    } );
                } );
            }
        } catch ( err ) {
            // Unfound config, etc
            console.error( `${ chalk.bold.yellow( 'Warning: ' ) }Something went wrong deleting host file entries. There may still be remnants in /etc/hosts` );
        }
    }

    console.log( 'Deleting Files' );
    await fs.remove( envPath );

    console.log( 'Deleting Database' );
    await database.deleteDatabase( envSlug );
};

const upgradeEnv = async function( env ) {
    const envPath = await envUtils.getPathOrError( env );

    // If we got the path from the cwd, we don't have a slug yet, so get it
    const envSlug = envUtils.envSlug( env );

    const yaml = readYaml.sync( path.join( envPath, 'docker-compose.yml' ) );

    const services = [ 'nginx', 'phpfpm', 'elasticsearch' ];

    // Update defined services to have all cached volumes
    for ( const service of services ) {
        if ( ! yaml.services[ service ] ) {
            continue;
        }
        for ( const key in yaml.services[ service ].volumes ) {
            const volume = yaml.services[ service ].volumes[ key ];
            const parts = volume.split( ':' );
            if ( parts.length === 2 ) {
                parts.push( 'cached' );
            }

            yaml.services[ service ].volumes[ key ] = parts.join( ':' );
        }
    }

    await new Promise( resolve => {
        writeYaml( path.join( envPath, 'docker-compose.yml' ), yaml, { 'lineWidth': 500 }, function( err ) {
            if ( err ) {
                console.log( err );
            }
            console.log( `Finished updating ${envSlug}` );
            resolve();
        } );
    } );
};

/**
 * Upgrades WP Local Docker to v2.6.0
 *
 * @param {String} env Environment
 * @return {void}
 */
const upgradeEnvTwoDotSix = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if ( env === false || undefined === env || env.trim().length === 0 ) {
        env = await envUtils.promptEnv();
    }

    const envPath = await envUtils.getPathOrError( env );

    // If we got the path from the cwd, we don't have a slug yet, so get it
    const envSlug = envUtils.envSlug( env );

    await stop( envSlug );

    // Create a backup of the old yaml.
    const yaml = readYaml.sync( path.join( envPath, 'docker-compose.yml' ) );
    await new Promise( resolve => {
        writeYaml( path.join( envPath, 'docker-compose.yml.bak' ), yaml, { 'lineWidth': 500 }, function( err ) {
            if ( err ) {
                console.log( err );
            }
            console.log( `Created backup of previous configuration ${envSlug}` );
            resolve();
        } );
    } );

    // perform the previous upgrade first
    await upgradeEnv( env );

    console.log( 'Copying required files...' );
    await fs.ensureDir( path.join( envPath, '.containers' ) );
    await fs.copy( path.join( envUtils.srcPath, 'containers' ), path.join( envPath, '.containers' ) );

    // Create a new object for the upgrade yaml.
    const upgraded = Object.assign( {}, yaml );

    // Set docker-compose version.
    upgraded.version = '2.2';

    // Upgrade image.
    const phpVersion = yaml.services.phpfpm.image.split( ':' ).pop();
    if ( phpVersion === '5.5' ) {
        console.warn( 'Support for PHP v5.5 was removed in the latest version of WP Local Docker.' );
        console.error( 'This environment cannot be upgraded.  No changes were made.' );

        process.exit( 1 );
    }
    upgraded.services.phpfpm.image = images[`php${phpVersion}`];

    // Upgrade volume mounts.
    const deprecatedVolumes = [
        './config/php-fpm/php.ini:/usr/local/etc/php/php.ini:cached',
        './config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini:cached',
        '~/.ssh:/root/.ssh:cached'
    ];
    const volumes = [ ...upgraded.services.phpfpm.volumes ];
    upgraded.services.phpfpm.volumes = volumes.reduce( ( acc, curr ) => {
        if ( deprecatedVolumes.includes( curr ) ) {
            if ( deprecatedVolumes.indexOf( curr ) === 1 ) {
                acc.push( './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/docker-php-ext-xdebug.ini:cached' );
                return acc;
            }
            return acc;
        }
        acc.push( curr );
        return acc;
    }, [] );

    // Add new environmental variables.
    upgraded.services.phpfpm.environment = {
        'ENABLE_XDEBUG': 'false'
    };

    // Unlike Mac and Windows, Docker is a first class citizen on Linux
    // and doesn't have any kind of translation layer between users and the
    // file system. Because of this the phpfpm container will be running as the
    // wrong user. Here we setup the docker-compose.yml file to rebuild the
    // phpfpm container so that it runs as the user who created the project.
    if ( os.platform() == 'linux' ) {
        upgraded.services.phpfpm.image = `wp-php-fpm-dev-${phpVersion}-${process.env.USER}`;
        upgraded.services.phpfpm.build = {
            'dockerfile': '.containers/php-fpm',
            'context': '.',
            'args': {
                'PHP_IMAGE': images[`php${phpVersion}`],
                'CALLING_USER': process.env.USER,
                'CALLING_UID': process.getuid()
            }
        };
        upgraded.services.phpfpm.volumes.push( `~/.ssh:/home/${process.env.USER}/.ssh:cached` );
    }
    else {
        // the official containers for this project will have a www-data user.
        upgraded.services.phpfpm.volumes.push( '~/.ssh:/home/www-data/.ssh:cached' );
    }

    await new Promise( resolve => {
        writeYaml( path.join( envPath, 'docker-compose.yml' ), upgraded, { 'lineWidth': 500 }, function( err ) {
            if ( err ) {
                console.log( err );
            }
            console.log( `Finished updating ${envSlug} for WP Local Docker v2.6` );
            resolve();
        } );
    } );

    start( envSlug );
};

const startAll = async function() {
    const envs = await envUtils.getAllEnvironments();

    await gateway.startGlobal();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await start( envs[i] );
    }
};

const stopAll = async function() {
    const envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await stop( envs[ i ] );
    }

    gateway.stopGlobal();
};

const restartAll = async function() {
    const envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await restart( envs[ i ] );
    }

    gateway.restartGlobal();
};

const deleteAll = async function() {
    const envs = await envUtils.getAllEnvironments();

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
            case 'upgrade':
                upgradeEnvTwoDotSix( commandUtils.commandArgs() );
                break;
            default:
                help();
                break;
        }
    }
};

module.exports = { command, start, stop, stopAll, restart, help };
