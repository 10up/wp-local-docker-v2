const commandUtils = require( './command-utils' );
const execSync = require( 'child_process' ).execSync;
const envUtils = require( './env-utils' );
const gateway = require( './gateway' );
const environment = require( './environment' );

const command = async function() {
    let envSlug = await envUtils.parseOrPromptEnv();
    if ( envSlug === false ) {
        console.error( 'Error: Unable to determine which environment to open a shell for. Please run this command from within your environment.' );
        process.exit( 1 );
    }

    let envPath = await envUtils.envPath( envSlug );
    let container = commandUtils.subcommand() || 'phpfpm';

    // Check if the container is running, otherwise, start up the stacks
    try {
        let output = execSync( 'docker-compose ps', {cwd: envPath} ).toString();
        if ( output.indexOf( container ) === -1 ) {
            await gateway.startGlobal();
            await environment.start( envSlug );
        }
    } catch ( ex ) {}

    try {
        execSync( `docker-compose exec ${container} bash`, { stdio: 'inherit', cwd: envPath } );
    } catch ( ex ) {}

    process.exit();
};

module.exports = { command };
