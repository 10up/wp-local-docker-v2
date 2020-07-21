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

const config = require( './configure' );
const promptValidators = require( './prompt-validators' );
const database = require( './database' );
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );

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

async function start( env, spinner, pull ) {
    const envPath = await getPathOrError( env, spinner );
    const envSlug = envUtils.envSlug( env );

    await gateway.startGlobal( spinner, pull );

    const composeArgs = {
        cwd: envPath,
        log: !spinner,
    };

    if ( pull ) {
        if ( spinner ) {
            spinner.start( `Pulling latest images for ${chalk.cyan( envSlug )}...` );
        } else {
            console.log( 'Pulling latest images for containers' );
        }

        await compose.pullAll( composeArgs );

        if ( spinner ) {
            spinner.succeed( `${chalk.cyan( envSlug )} environment images are up-to-date...` );
        }
    }

    if ( spinner ) {
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

async function deleteEnv( env, spinner ) {
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
}

async function upgradeEnv( env ) {
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
}

async function startAll( spinner, pull ) {
    const envs = await envUtils.getAllEnvironments();

    await gateway.startGlobal( spinner, pull );

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await start( envs[i], spinner, pull );
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

module.exports = {
    start,
    startAll,
    stop,
    stopAll,
    deleteEnv,
    deleteAll,
    restart,
    restartAll,
    upgradeEnv,
};
