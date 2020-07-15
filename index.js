#!/usr/bin/env node

const path = require( 'path' );
const chalk = require( 'chalk' );

const commandUtils = require( './src/command-utils' );
const config = require( './src/configure' );

const help = function() {
    const help = `
Usage: 10updocker COMMAND

Commands:
  cache         Manages the build cache
  configure     Set up a configuration for WP Local Docker
  create        Create a new docker environment
  delete        Deletes a specific docker environment
  image         Manages docker images used by this environment
  logs          Shows logs from the specified container in your current environment (Defaults to all containers)
  migrate       Migrates a V1 WP Local Docker environment to a new V2 environment.
  restart       Restarts a specific docker environment
  shell         Opens a shell for a specified container in your current environment (Defaults to the phpfpm container)
  start         Starts a specific docker environment
  stop          Stops a specific docker environment
  wp            Runs a wp-cli command in your current environment
  wpsnapshots   Runs a wp snapshots command

Run '10updocker COMMAND help' for more information on a command.
`;
    console.log( help );
};

const version = function() {
    const pjson = require( './package.json' );
    console.log( 'WP Local Docker' );
    console.log( `Version ${pjson.version}` );
};

const completion = function() {
    const filename = path.resolve( __dirname, 'scripts', '10updocker-completion.bash' );
    console.log( `source ${filename}` );
};

const init = async function() {
    const command = commandUtils.command();
    const configured = await config.checkIfConfigured();
    const bypassCommands = [ undefined, 'configure', 'help', '--version', '-v', '--completion' ];
    const isBypass = bypassCommands.indexOf( command ) !== -1;

    // Configure using defaults if not configured already
    if ( configured === false && isBypass === false ) {
        await config.configureDefaults();
    }

    // Don't even run the command to check if docker is running if we have one of the commands that don't need it
    if ( isBypass === false ) {
        const isRunning = commandUtils.checkIfDockerRunning();

        // Show warning if docker isn't running
        if ( isRunning === false ) {
            console.error( chalk.red( 'Error: Docker doesn\'t appear to be running. Please start Docker and try again' ) );
            process.exit();
        }

        // Check for updates
        await commandUtils.checkForUpdates();
    }

    switch ( command ) {
        case 'configure':
            config.command();
            break;
        case 'create':
            await require( './src/create' ).command();
            break;
        case 'start':
        case 'stop':
        case 'restart':
        case 'delete':
        case 'remove':
        case 'upgrade':
            await require( './src/environment' ).command();
            break;
        case 'snapshots':
        case 'wpsnapshots':
            await require( './src/wpsnapshots' ).command();
            break;
        case 'cache':
            await require( './src/cache' ).command();
            break;
        case 'image':
            await require( './src/image' ).command();
            break;
        case 'shell':
            await require( './src/shell' ).command();
            break;
        case 'wp':
            await require( './src/wp' ).command();
            break;
        case 'logs':
            await require( './src/logs' ).command();
            break;
        case 'migrate':
            await require( './src/migrate' ).command();
            break;
        case '--version':
        case '-v':
            version();
            break;
        case '--completion':
            completion();
            break;
        default:
            help();
            break;
    }
};

init();
