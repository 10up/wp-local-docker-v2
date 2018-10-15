const commandUtils = require( './command-utils' );
const execSync = require('child_process').execSync;
const envUtils = require('./env-utils');
const gateway = require( './gateway' );
const environment = require( './environment' );

const command = async function() {
    let envSlug = await envUtils.parseOrPromptEnv();
    if ( envSlug === false ) {
        console.error( "Error: Unable to determine which environment to use WP CLI with. Please run this command from within your environment's directory." );
        process.exit(1);
    }

    let envPath = await envUtils.envPath( envSlug );

    // Check if the container is running, otherwise, start up the stacks
    try {
        let output = execSync( `docker-compose ps`, { cwd: envPath } ).toString();
        if ( output.indexOf( 'phpfpm' ) === -1 ) {
            await gateway.startGlobal();
            await environment.start( envSlug );
        }
    } catch (ex) {}

    // Get everything after the wp command, so we can pass to the docker container
    let command = commandUtils.commandArgs();

    // Check for TTY
    let ttyFlag = process.stdin.isTTY ? '' : '-T';

    // Run the command
    try {
        execSync( `docker-compose exec ${ttyFlag} --user www-data phpfpm wp ${command}`, { stdio: 'inherit', cwd: envPath });
    } catch (ex) {}

    process.exit();
};

module.exports = { command };
