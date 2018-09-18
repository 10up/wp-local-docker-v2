const commandUtils = require( './command-utils' );
const execSync = require('child_process').execSync;
const envUtils = require('./env-utils');
const gateway = require( './gateway' );
const environment = require( './environment' );

const command = async function() {
    let envSlug = await envUtils.parseOrPromptEnv();
    if ( envSlug === false ) {
        console.error( "Error: Unable to determine which environment to use wp snapshots with. Please run this command from within your environment." );
        process.exit(1);
    }

    let envPath = await envUtils.envPath( envSlug );
    let container = commandUtils.subcommand() || '';

    // Check if the container is running, otherwise, start up the stacks
    // If we're listening for output on all containers (subcommand is '') don't start, just attach
    try {
        let output = execSync( `cd ${envPath} && docker-compose ps` ).toString();
        if ( container && output.indexOf( container ) === -1 ) {
            await gateway.startGlobal();
            await environment.start( envSlug );
        }
    } catch (ex) {}

    try {
        execSync( `cd ${envPath} && docker-compose logs -f ${container}`, { stdio: 'inherit' });
    } catch (ex) {}

    process.exit();
};

module.exports = { command };
