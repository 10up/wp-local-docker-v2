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
config = require( './configure' );
const chalk = require( 'chalk' );
const readYaml = require( 'read-yaml' );
const writeYaml = require( 'write-yaml' );

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

const start = async function( env ) {
    if ( undefined === env || env.trim().length === 0 ) {
        env = await envUtils.parseEnvFromCWD();
    }

	// Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
	if ( env === false || undefined === env || env.trim().length === 0 ) {
		env = await envUtils.promptEnv();
	}

    let envPath = await envUtils.getPathOrError(env);

    // If we got the path from the cwd, we don't have a slug yet, so get it
	let envSlug = envUtils.envSlug( env );

    await gateway.startGlobal();

    console.log( `Starting docker containers for ${envSlug}` );
    try {
        execSync( `docker-compose up -d`, { stdio: 'inherit', cwd: envPath });
    } catch (ex) {}

    let envHosts = await envUtils.getEnvHosts( envPath );
    if ( envHosts.length > 0 ) {
        console.log();
        console.log( "Environment configured for the following domains:" );
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

    let envPath = await envUtils.getPathOrError(env);

    // If we got the path from the cwd, we don't have a slug yet, so get it
	let envSlug = envUtils.envSlug( env );

    console.log( `Stopping docker containers for ${envSlug}` );
    try {
        execSync( `docker-compose down`, { stdio: 'inherit', cwd: envPath });
    } catch (ex) {}
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

    let envPath = await envUtils.getPathOrError(env);

    // If we got the path from the cwd, we don't have a slug yet, so get it
	let envSlug = envUtils.envSlug( env );

    await gateway.startGlobal();

    console.log( `Restarting docker containers for ${envSlug}` );
    try {
        execSync( `docker-compose restart`, { stdio: 'inherit', cwd: envPath });
    } catch (ex) {
        // Usually because the environment isn't running
    }
    console.log();
};

const deleteEnv = async function( env ) {
    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if ( env === false || undefined === env || env.trim().length === 0 ) {
        env = await envUtils.promptEnv();
    }

    let envPath = await envUtils.getPathOrError( env );
    let envSlug = envUtils.envSlug( env );

    let answers = await inquirer.prompt({
        name: 'confirm',
        type: 'confirm',
        message: `Are you sure you want to delete the ${envSlug} environment`,
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
        execSync( `docker-compose down -v`, { stdio: 'inherit', cwd: envPath });
    } catch (ex) {
        // If the docker-compose file is already gone, this happens
    }

    if ( await config.get( 'manageHosts' ) === true ) {
        try {
            console.log( "Removing host file entries" );

            let sudoOptions = {
                name: "WP Local Docker"
            };

            let envHosts = await envUtils.getEnvHosts( envPath );
            for ( let i = 0, len = envHosts.length; i < len; i++ ) {
                await new Promise( resolve => {
                    console.log( ` - Removing ${envHosts}` );
                    sudo.exec(`10updocker-hosts remove ${envHosts}`, sudoOptions, function (error, stdout, stderr) {
                        if (error) {
                            console.error( chalk.bold.yellow( "Warning: ") + "Something went wrong deleting host file entries. There may still be remnants in /etc/hosts" );
                            resolve();
                            return;
                        }
                        console.log(stdout);
                        resolve();
                    });
                });
            }
        } catch (err) {
            // Unfound config, etc
            console.error( chalk.bold.yellow( "Warning: ") + "Something went wrong deleting host file entries. There may still be remnants in /etc/hosts" );
        }
    }

    console.log( "Deleting Files" );
    await fs.remove( envPath );

    console.log( 'Deleting Database' );
    await database.deleteDatabase( envSlug );
};

const upgradeEnv = async function( env ) {
	if ( undefined === env || env.trim().length === 0 ) {
		env = await envUtils.parseEnvFromCWD();
	}

	// Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
	if ( env === false || undefined === env || env.trim().length === 0 ) {
		env = await envUtils.promptEnv();
	}

	let envPath = await envUtils.getPathOrError(env);

	// If we got the path from the cwd, we don't have a slug yet, so get it
	let envSlug = envUtils.envSlug( env );

	let yaml = readYaml.sync( path.join( envPath, 'docker-compose.yml' ) );

	let services = [ 'nginx', 'phpfpm', 'elasticsearch' ];

	// Update defined services to have all cached volumes
	for ( let service of services ) {
		for ( let key in yaml.services[ service ].volumes ) {
			let volume = yaml.services[ service ].volumes[ key ];
			let parts = volume.split( ':' );
			if ( 3 !== parts.length ) {
				parts.push( 'cached' );
			}

			yaml.services[ service ].volumes[ key ] = parts.join( ':' );
		}
	}

	await new Promise( resolve => {
		writeYaml( path.join( envPath, 'docker-compose.yml' ), yaml, { 'lineWidth': 500 }, function( err ) {
			if ( err ) {
				console.log(err);
			}
			console.log( `Finished updating ${envSlug}` );
			resolve();
		});
	});

	start( envSlug );
};

const startAll = async function() {
    let envs = await envUtils.getAllEnvironments();

    await gateway.startGlobal();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await start( envs[i] );
    }
};

const stopAll = async function() {
    let envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await stop( envs[ i ] );
    }

    gateway.stopGlobal();
};

const restartAll = async function() {
    let envs = await envUtils.getAllEnvironments();

    for ( let i = 0, len = envs.length; i < len; i++ ) {
        await restart( envs[ i ] );
    }

    gateway.restartGlobal();
};

const deleteAll = async function() {
    let envs = await envUtils.getAllEnvironments();

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
                upgradeEnv( commandUtils.commandArgs() );
                break;
            default:
                help();
                break;
        }
    }
};

module.exports = { command, start, stop, restart, help };
