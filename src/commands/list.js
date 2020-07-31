/**
 * External dependencies.
 */
const { table } = require( 'table' );
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

/**
 * Internal dependencies.
 */
const envUtils = require( '../env-utils' );
const makeCommand = require( '../utils/make-command' );
const makeDocker = require( '../utils/make-docker' );

// Add command name, alias and description.
exports.aliases = [ 'ls' ];
exports.command = 'list';
exports.desc = 'Lists all the environments and meta information.';

exports.handler = makeCommand( chalk, logSymbols, async () => {
    // Get all the environments and initialize a status array.
    const environments = await envUtils.getAllEnvironments();
    const envStatus = [ [ 'Name', 'Service Status', 'URL' ] ];

    // Loop through each environment and add details.
    for ( const envSlug of environments ) {
        // Get path of the current environment to perform dedicated checks.
        const envPath = await envUtils.envPath( envSlug );

        // Get current environment host name, use the starting index.
        const envHosts = await envUtils.getEnvHosts( envPath );
        const hostName = envHosts[0];

        try {
            const docker = makeDocker();
            const containers = await docker.listContainers( { filters: { 'name': [ envSlug ] } } );
            if ( Array.isArray( containers ) && containers.length ) {
                const siteServices = containers.map( siteName => siteName.Names[0] );
                const hasPHP = typeof siteServices.find( siteService => siteService.includes( `${ envSlug }_phpfpm` ) ) !== 'undefined' ? 'UP' : 'DOWN';
                const hasNGINX = typeof siteServices.find( siteService => siteService.includes( `${ envSlug }_nginx` ) ) !== 'undefined' ? 'UP': 'DOWN';
                // Check if php and nginx containers are available, if yes then add to list with it's status.
                envStatus.push( [ envSlug, `php: ${ hasPHP }, nginx: ${ hasNGINX }`, hostName ] );
            } else {
                envStatus.push( [ envSlug, 'DOWN', hostName ] );
            }
        } catch( ex ) {
            console.error( ex );
        }
    }

    // Output the environment status.
    console.log( table( envStatus ) );
} );
