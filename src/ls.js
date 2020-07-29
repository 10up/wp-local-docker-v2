const { execSync } = require( 'child_process' );
const envUtils = require( './env-utils' );

const command = async function () {
    // Get all the environments and initialize a status array.
    const environments = await envUtils.getAllEnvironments();
    const envStatus = [];

    // Loop through each environment and add details.
    for ( const envSlug of environments ) {
        // Get path of the current environment to perform dedicated checks.
        const envPath = await envUtils.envPath( envSlug );

        // Get current environment host name, use the starting index.
        const envHosts = await envUtils.getEnvHosts( envPath );
        const hostName = envHosts[0];

        try {
            // Get the container list for current environment passing name of the slug to filter.
            const output = execSync( `docker ps --filter "name=${envSlug}"` ).toString();

            // Check if php and nginx containers are available, if yes then store with status UP, else DOWN.
            if ( output.indexOf( `${envSlug}_phpfpm` ) !== -1 && output.indexOf( `${envSlug}_nginx` ) !== -1 ) {
                envStatus.push( { name: envSlug, status: 'UP', host: hostName } );
            } else {
                envStatus.push( { name: envSlug, status: 'DOWN', host: hostName } );
            }
        } catch( ex ) {
            console.error( ex );
        }
    }

    // Output the environment status.
    console.table( envStatus );

    process.exit();
};

module.exports = { command };
