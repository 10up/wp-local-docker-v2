const { EOL } = require( 'os' );

const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );
const compose = require( 'docker-compose' );

const envUtils = require( '../env-utils' );
const gateway = require( '../gateway' );
const environment = require( '../environment' );
const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );

exports.command = 'logs [<container>]';
exports.desc = 'Shows logs from the specified container in your environment (Defaults to all containers).';

exports.builder = function( yargs ) {
    yargs.positional( 'container', {
        describe: 'Container name',
        type: 'string',
    } );
};

exports.handler = makeCommand( chalk, logSymbols, async ( { verbose, container, env } ) => {
    let envSlug = env;
    if ( ! envSlug ) {
        envSlug = await envUtils.parseOrPromptEnv();
    }

    if ( envSlug === false ) {
        throw new Error( 'Error: Unable to determine which environment to show logs from. Please run this command from within your environment.' );
    }

    const envPath = await envUtils.envPath( envSlug );
    const services = [];
    const spinner = ! verbose ? makeSpinner() : undefined;

    if ( container ) {
        spinner && spinner.start( 'Checking available services...' );

        const { out } = await compose.ps( {
            commandOptions: [ '--services' ],
            cwd: envPath,
        } );

        const availableServices = out
            .split( EOL )
            .filter( ( service ) => service.trim().length > 0 )
            .map( ( service ) => service.toLowerCase() );

        if ( availableServices.includes( container.toLowerCase() ) ) {
            services.push( container );
            spinner && spinner.succeed( 'Container is available...' );
        } else {
            spinner && spinner.warn( 'Container is not found, using all containers...' );
        }
    }

    spinner && spinner.start( 'Checking if the environment running...' );
    // Check if the container is running, otherwise, start up the stacks
    const { out } = await compose.ps( {
        cwd: envPath,
    } );

    if ( ( services.length > 0 && out.indexOf( services[0] ) === -1 ) || out.split( EOL ).filter( ( line ) => line.trim().length > 0 ).length <= 2 ) {
        spinner && spinner.info( 'Environment is not running, starting it...' );
        await gateway.startGlobal( spinner );
        await environment.start( envSlug, spinner );
    } else {
        spinner && spinner.succeed( 'Environment is running...' );
    }

    await compose.logs( services, {
        cwd: envPath,
        follow: true,
        log: true,
    } );
} );