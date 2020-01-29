const commandUtils = require( './command-utils' );
const { execSync } = require( 'child_process' );
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const environment = require( './environment' );

const command = async function() {
    const envSlug = await envUtils.parseOrPromptEnv();
    if ( envSlug === false ) {
        console.error( 'Error: Unable to determine which environment to use WP CLI with. Please run this command from within your environment\'s directory.' );
        process.exit( 1 );
    }

    const envPath = await envUtils.envPath( envSlug );

    // Check if the container is running, otherwise, start up the stacks
    try {
        const output = execSync( 'docker-compose ps', { cwd: envPath } ).toString();
        if ( output.indexOf( 'phpfpm' ) === -1 ) {
            await gateway.startGlobal();
            await environment.start( envSlug );
        }
    } catch ( ex ) {}

    // Get everything after the wp command, so we can pass to the docker container
    const command = commandUtils.commandArgs();

    // Check for TTY
    const ttyFlag = process.stdin.isTTY ? '' : '-T';

    // Run the command
    try {
        execSync( `docker-compose exec ${ttyFlag} phpfpm wp ${command}`, { stdio: 'inherit', cwd: envPath } );
    } catch ( ex ) {}

    process.exit();
};

module.exports = { command };
