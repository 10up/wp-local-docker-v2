const execSync = require('child_process').execSync;
const envUtils = require('./env-utils');
const gateway = require( './gateway' );
const environment = require( './environment' );

const command = async function() {
    let envSlug = await envUtils.parseEnvFromCWD();
    if ( envSlug === false ) {
        console.error( "Error: Unable to determine which environment to use wp snapshots with. Please run this command from within your environment." );
        process.exit(1);
    }

    let envPath = await envUtils.envPath( envSlug );

    // Check if the container is running, otherwise, start up the stacks
    try {
        let output = execSync( `cd ${envPath} && docker-compose ps` ).toString();
        if ( output.indexOf( 'phpfpm' ) === -1 ) {
            await gateway.startGlobal();
            await environment.start( envSlug );
        }
    } catch (ex) {}

    // Run the command
    try {
        execSync( `cd ${envPath} && docker-compose exec --user www-data phpfpm wp "$*"`, { stdio: 'inherit' });
    } catch (ex) {
        console.log(ex);
        console.log(ex.toString());
    }

    process.exit();
};

module.exports = { command };
