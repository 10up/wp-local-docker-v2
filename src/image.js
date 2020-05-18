const commandUtils = require( './command-utils' );
const gateway = require( './gateway' );
const environment = require( './environment' );
const inquirer = require( 'inquirer' );
const promptValidators = require( './prompt-validators' );
const os = require( 'os' );
const { execSync } = require( 'child_process' );

// These have to exist, so we don't bother checking if they exist on the system first
const globalImages = {
    'nginx-proxy': '10up/nginx-proxy:latest',
    'mysql': 'mysql:5',
    'mailcatcher': 'schickling/mailcatcher',
    'phpmyadmin': 'phpmyadmin/phpmyadmin'
};

const images = {
    'php7.4': '10up/wp-php-fpm-dev:7.4',
    'php7.3': '10up/wp-php-fpm-dev:7.3',
    'php7.2': '10up/wp-php-fpm-dev:7.2',
    'php7.1': '10up/wp-php-fpm-dev:7.1',
    'php7.0': '10up/wp-php-fpm-dev:7.0',
    'php5.6': '10up/wp-php-fpm-dev:5.6',
    'wpsnapshots': '10up/wpsnapshots:dev',
    'memcached': 'memcached:latest',
    'nginx': 'nginx:latest',
    'elasticsearch': 'docker.elastic.co/elasticsearch/elasticsearch:5.6.16'
};

const help = function() {
    const help = `
Usage: 10updocker image update

Updates any docker images used by your environment to the latest versions available for the specified tag. All environments must be stopped to update images.
`;
    console.log( help );
    process.exit();
};

const update = function( image ) {
    try { 
        execSync( `docker pull ${image}`, { stdio: 'inherit' } );
    } 
    catch ( ex ) {

    }
    console.log();
};

const updateIfUsed = function( image ) {
    console.log( `Testing ${image}` );
    const result = execSync( `docker image ls ${image}` ).toString();
    // All images say how long "ago" they were created.. Use this to determine if the image exists, since `wc -l` doesn't work on windows
    if ( result.indexOf( 'ago' ) === -1 ) {
        console.log( `${image} doesn't exist on this system. Skipping update.` );
        return;
    }

    update( image );
};

const updateAll = function() {
    // eslint-disable-next-line no-unused-vars
    for ( const [ imageName, imageUrl ] of Object.entries( globalImages ) ) {
        update( imageUrl );
    }

    // eslint-disable-next-line no-unused-vars
    for ( const [ imageName, imageUrl ] of Object.entries( images ) ) {
        updateIfUsed( imageUrl );
    }

    // delete the built containers on linux so it can be rebuilt with the (possibly) updated
    // phpfpm container
    if ( os.platform() == 'linux' ) {
        console.log( 'Removing previously built images so they can be built again' );
        execSync( 'docker image rm $(docker image ls -qf label=com.10up.wp-local-docker=user-image)' );
    }
};

const stopAll = async function() {
    await environment.stopAll();
    await gateway.stopGlobal();
};

const confirm = async function() {
    const answers = await inquirer.prompt( {
        name: 'confirm',
        type: 'confirm',
        message: 'Updating images requires all environments to be stopped. Is that okay?',
        validate: promptValidators.validateNotEmpty,
        default: false,
    } );

    return answers.confirm;
};

const command = async function() {
    switch ( commandUtils.subcommand() ) {
        case 'update':
            if ( await confirm() ) {
                await stopAll();
                updateAll();
                console.log( 'Finished. You can now start your environments again.' );
            }
            else {
                console.log( 'Image update canceled' );
            }
            break;
        default:
            await help();
            break;
    }
};

module.exports = { command, globalImages, images };
