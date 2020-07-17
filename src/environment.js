const path = require( 'path' );
const os = require( 'os' );

const fs = require( 'fs-extra' );
const inquirer = require( 'inquirer' );
const sudo = require( 'sudo-prompt' );
const chalk = require( 'chalk' );
const readYaml = require( 'read-yaml' );
const writeYaml = require( 'write-yaml' );
const compose = require( 'docker-compose' );
const which = require( 'which' );
const logSymbols = require( 'log-symbols' );

const { images } = require( './docker-images' );
const config = require( './configure' );
const promptValidators = require( './prompt-validators' );
const database = require( './database' );
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const commandUtils = require( './command-utils' );
const makeSpinner = require( './utils/make-spinner' );
const makeCommand = require( './utils/make-command' );

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

function getPathOrError( env, spinner ) {
    // @ts-ignore
    return envUtils.getPathOrError( env, {
        log() {},
        error( err ) {
            if ( spinner ) {
                throw new Error( err );
            } else {
                console.error( err );
            }
        },
    } );
}

async function start( env, spinner ) {
    const envPath = await getPathOrError( env, spinner );
    const envSlug = envUtils.envSlug( env );

    await gateway.startGlobal( spinner );

    const composeArgs = {
        cwd: envPath,
        log: !spinner,
    };

    if ( spinner ) {
        spinner.start( `Pulling latest images for ${chalk.cyan( envSlug )}...` );
    } else {
        console.log( 'Pulling latest images for containers' );
    }

    await compose.pullAll( composeArgs );

    if ( spinner ) {
        spinner.succeed( `${chalk.cyan( envSlug )} environment images are up-to-date...` );
        spinner.start( `Starting docker containers for ${chalk.cyan( envSlug )}...` );
    } else {
        console.log( `Starting docker containers for ${envSlug}` );
    }

    await compose.upAll( composeArgs );

    if ( spinner ) {
        spinner.succeed( `${chalk.cyan( envSlug )} environment is started...` );
    } else {
        console.log();
    }

    const envHosts = await envUtils.getEnvHosts( envPath );
    if ( Array.isArray( envHosts ) && envHosts.length > 0 ) {
        if ( spinner ) {
            spinner.info( `Environment is configured for the following domains: ${envHosts.join( ', ' )}` );
        } else {
            console.log( `Environment is configured for the following domains:${os.EOL}${envHosts.join( os.EOL )}` );
        }
    }
}

async function stop( env, spinner ) {
    const envPath = await getPathOrError( env, spinner );
    const envSlug = envUtils.envSlug( env );

    if ( spinner ) {
        spinner.start( `Stopping docker containers for ${chalk.cyan( envSlug )}...` );
    } else {
        console.log( `Stopping docker containers for ${envSlug}` );
    }

    await compose.down( {
        cwd: envPath,
        log: !spinner,
    } );

    if ( spinner ) {
        spinner.succeed( `${chalk.cyan( envSlug )} environment is stopped...` );
    } else {
        console.log();
    }
}

async function restart( env, spinner ) {
    const envPath = await getPathOrError( env, spinner );
    const envSlug = envUtils.envSlug( env );

    await gateway.startGlobal( spinner );

    if ( spinner ) {
        spinner.start( `Restarting docker containers for ${chalk.cyan( envSlug )}...` );
    } else {
        console.log( `Restarting docker containers for ${envSlug}` );
    }

    const composeArgs = {
        cwd: envPath,
        log: !spinner,
    };

    const { out } = await compose.ps( composeArgs );
    const services = out.split( '\n' ).filter( ( service ) => !! service );

    // if we have more than just two lines, then we have running services and can restart it
    // otherwise we need just start it
    if ( services.length > 2 ) {
        await compose.restartAll( composeArgs );
    } else {
        await compose.upAll( composeArgs );
    }

    if ( spinner ) {
        spinner.succeed( `${chalk.cyan( envSlug )} environment is restarted...` );
    } else {
        console.log();
    }
}

const deleteEnv = async function( env, spinner ) {
    const envPath = await getPathOrError( env, spinner );
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

    await gateway.startGlobal( spinner );

    // Stop the environment, and ensure volumes are deleted with it
    if ( spinner ) {
        spinner.start( 'Deleting containers...' );
    } else {
        console.log( 'Deleting containers' );
    }

    try {
        await compose.down( {
            cwd: envPath,
            log: !spinner,
            commandOptions: [ '-v' ],
        } );
    } catch ( ex ) {
        // If the docker-compose file is already gone, this happens
    }

    if ( spinner ) {
        spinner.start( 'Containers are deleted...' );
    }

    if ( await config.get( 'manageHosts' ) === true ) {
        try {
            if ( spinner ) {
                spinner.start( 'Removing host file entries...' );
            } else {
                console.log( 'Removing host file entries' );
            }

            const sudoOptions = { name: 'WP Local Docker' };
            const envHosts = await envUtils.getEnvHosts( envPath );

            const node = await which( 'node' );
            const hostsScript = path.join( path.resolve( __dirname, '..' ), 'hosts.js' );
            const hostsToDelete = envHosts.join( ' ' );

            await new Promise( resolve => {
                if ( !spinner ) {
                    console.log( ` - Removing ${hostsToDelete}` );
                }

                sudo.exec( `${node} ${hostsScript} remove ${hostsToDelete}`, sudoOptions, ( error, stdout ) => {
                    if ( error ) {
                        if ( spinner ) {
                            spinner.warn( 'Something went wrong deleting host file entries. There may still be remnants in /etc/hosts' );
                        } else {
                            console.error( `${ chalk.bold.yellow( 'Warning: ' ) }Something went wrong deleting host file entries. There may still be remnants in /etc/hosts` );
                        }
                    } else {
                        if ( spinner ) {
                            spinner.succeed( 'Host file entries are deleted...' );
                        } else {
                            console.log( stdout );
                        }
                    }

                    resolve();
                } );
            } );
        } catch ( err ) {
            // Unfound config, etc
            if ( spinner ) {
                spinner.warn( 'Something went wrong deleting host file entries. There may still be remnants in /etc/hosts' );
            } else {
                console.error( `${ chalk.bold.yellow( 'Warning: ' ) }Something went wrong deleting host file entries. There may still be remnants in /etc/hosts` );
            }
        }
    }

    if ( spinner ) {
        spinner.start( 'Deleting environment files...' );
    } else {
        console.log( 'Deleting Files' );
    }

    await fs.remove( envPath );

    if ( spinner ) {
        spinner.succeed( 'Environment files are deleted...' );
        spinner.start( 'Deleting Database...' );
    } else {
        console.log( 'Deleting Database' );
    }

    await database.deleteDatabase( envSlug );

    if ( spinner ) {
        spinner.succeed( 'Database is deleted...' );
    }
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

async function startAll( spinner ) {
    const envs = await envUtils.getAllEnvironments();

    await gateway.startGlobal( spinner );

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await start( envs[i], spinner );
    }
}

async function stopAll( spinner ) {
    const envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await stop( envs[ i ], spinner );
    }

    await gateway.stopGlobal( spinner );
}

async function restartAll( spinner ) {
    const envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await restart( envs[ i ], spinner );
    }

    await gateway.restartGlobal( spinner );
}

async function deleteAll( spinner ) {
    const envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await deleteEnv( envs[ i ], spinner );
    }
}

async function command( { _, env, verbose } ) {
    const [ subcommand ] = _;
    const spinner = ! verbose ? makeSpinner() : undefined;
    const all = env === 'all';

    let envName = ( env || '' ).trim();
    if ( ! envName ) {
        envName = await envUtils.parseEnvFromCWD();
    }

    if ( ! envName ) {
        envName = await envUtils.promptEnv();
    }

    switch ( subcommand ) {
        case 'start':
            if ( all ) {
                await startAll( spinner );
            } else {
                await start( envName, spinner );
            }
            break;
        case 'stop':
            if ( all ) {
                await stopAll( spinner );
            } else {
                await stop( envName, spinner );
            }
            break;
        case 'restart':
            if ( all ) {
                await restartAll( spinner );
            } else {
                await restart( envName, spinner );
            }
            break;
        case 'delete':
        case 'remove':
            if ( all ) {
                await deleteAll( spinner );
            } else {
                await deleteEnv( envName, spinner );
            }
            break;
        case 'upgrade':
            await upgradeEnvTwoDotSix( envName );
            break;
        default:
            help();
            break;
    }
}

module.exports = {
    command: makeCommand( chalk, logSymbols, command ),
    start,
    stop,
    stopAll,
    restart,
    help,
};
