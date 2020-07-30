/**
 * External dependencies.
 */
const tableImport = require( 'table' );
const { table } = tableImport;
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

/**
 * Internal dependencies.
 */
const { execSync } = require( 'child_process' );
const envUtils = require( '../env-utils' );
const makeCommand = require( '../utils/make-command' );

// Add command name, alias and description.
exports.aliases = [ 'ls' ];
exports.command = 'list';
exports.desc = 'Lists all the environments and meta information.';

exports.handler = makeCommand( chalk, logSymbols, async () => {
    // Get all the environments and initialize a status array.
    const environments = await envUtils.getAllEnvironments();
    const envStatus = [ [ 'Name', 'Status', 'URL' ] ];

    // Loop through each environment and add details.
    for ( const envSlug of environments ) {
        // Get path of the current environment to perform dedicated checks.
        const envPath = await envUtils.envPath( envSlug );

        // Get current environment host name, use the starting index.
        const envHosts = await envUtils.getEnvHosts( envPath );
        const hostName = envHosts[0];

        try {
            // Get the container list for current environment passing name of the slug to filter.
            const output = execSync( `docker ps --filter "name=${ envSlug }"` ).toString();

            // Check if php and nginx containers are available, if yes then store with status UP, else DOWN.
            if ( output.indexOf( `${ envSlug }_phpfpm` ) !== -1 && output.indexOf( `${ envSlug }_nginx` ) !== -1 ) {
                envStatus.push( [ envSlug, 'UP', hostName ] );
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
