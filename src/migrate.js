const commandUtils = require( './command-utils' );
let envUtils = require( './env-utils' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const environment = require( './environment' );

const help = function() {
    let command = commandUtils.command();

    let help = `
Usage:  10updocker migrate OLD_PATH [ENVIRONMENT]

Migrate a WP Local Docker V1 environment into a new WP Local Docker V2 environment. 

OLD_PATH: Should be the path to the old WP Local Docker environment
ENVIRONMENT: The environment to migrate the V1 data into.

`;
    console.log( help );
    process.exit();
};

const validateOldEnv = async function( oldEnv ) {
    if ( ! await fs.exists( path.join( oldEnv, 'docker-compose.yml' ) ) ) {
        console.error( chalk.bold.red( "Error: " ) + "Could not find a docker-compose.yml file in the path specified for the old environment!" );
        process.exit();
    }

    if ( ! await fs.pathExists( path.join( oldEnv, 'data', 'db' ) ) ) {
        console.error( chalk.bold.red( "Error: " ) + "Could not find MySQL data in the path specified for the old environment!" );
        process.exit();
    }

    return true;
};

// Kind of like the one for gateway, but not using docker compose and adapted for this purpose
const waitForDB = function( containerName ) {
    let readyMatch = 'ready for connections';
    return new Promise( resolve => {
        let interval = setInterval(() => {
            console.log( "Waiting for mysql..." );
            exec( `docker logs ${containerName}`, (error, stdout, stderr) => {
                if ( error ) {
                    console.error( "Erro exporting database!" );
                    process.exit();
                }

                if ( stderr.indexOf( readyMatch ) !== -1 ) {
                    clearInterval( interval );
                    resolve();
                }
            } );
        }, 1000 );
    });
};

const exportOldDatabase = async function( oldEnv, exportDir ) {
    let dataDir = path.join( oldEnv, 'data', 'db' );
    let parts = path.parse( oldEnv );
    let base = `mysql-${parts.name}`;

    // Just in case this failed and are retrying
    try { execSync( `docker stop ${base}`); } catch(ex) {}

    try {
        execSync( `docker run -d --rm --name ${base} -v ${dataDir}:/var/lib/mysql -v ${exportDir}:/tmp/export mysql:5`, { stdio: 'inherit' });
        await waitForDB( base );
        console.log( "Exporting old database" );
        execSync( `docker exec ${base} sh -c "/usr/bin/mysqldump -u root -ppassword wordpress > /tmp/export/database.sql"`, { stdio: 'inherit' });
        execSync( `docker stop ${base}`);
    } catch (ex) {}
};

const importNewDatabase = async function( env ) {
    await environment.start( env );
    let envPath = await envUtils.getPathOrError( env );

    try {
        console.log( "Importing DB to new Environment" );
        execSync( `cd ${envPath} && docker-compose exec --user www-data phpfpm wp db import /var/www/html/import/database.sql`, { stdio: 'inherit' });
    } catch (ex) {}
};

const copySiteFiles = async function( oldEnv, newEnv ) {
    let envPath = await envUtils.getPathOrError( newEnv );
    let wpContent = path.join( envPath, 'wordpress', 'wp-content' );
    let oldWpContent = path.join( oldEnv, 'wordpress', 'wp-content' );

    // Clear out all the current environment content
    // Only doing wp-content for now, since otherwise we would need to keep wp-config.php... But what about customizations?
    console.log( `Removing current files from ${wpContent}` );
    await fs.emptyDir( wpContent );

    console.log( "Copying files from the old wp-content folder" );
    await fs.copy( oldWpContent, wpContent );
};

const command = async function() {
    if ( commandUtils.subcommand() === 'help' || commandUtils.subcommand() === undefined ) {
        help();
    } else {
        let old = commandUtils.getArg(1);
        let env = commandUtils.getArg(2);

        await validateOldEnv( old );
        let envPath = await envUtils.getPathOrError( env );

        // So that the DB is already in the folder mounted to docker
        let exportDir = path.join( envPath, 'wordpress', 'import' );
        await fs.ensureDir( exportDir );

        await exportOldDatabase( old, exportDir );
        await importNewDatabase( env );
        await copySiteFiles( old, env );

        console.log( chalk.bold.green("Success!") + " Your environment has been imported!" );
        console.log( " - wp-config.php has not been changed. Any custom configuration needs to be manually copied" );
        console.log( " - If you need to run a search/replace, run `10updocker wp search-replace <olddomain> <newdomain>`" );
    }
};

module.exports = { command, help };
