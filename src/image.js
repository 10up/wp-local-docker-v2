const commandUtils = require( './command-utils' );
const execSync = require('child_process').execSync;

// These have to exist, so we don't bother checking if they exist on the system first
const globalImages = [
    '10up/nginx-proxy:latest',
    'mysql:5',
    'schickling/mailcatcher',
    'phpmyadmin/phpmyadmin'
];
const images = [
    '10up/phpfpm:latest',
    '10up/phpfpm:7.2',
    '10up/phpfpm:7.1',
    '10up/phpfpm:7.0',
    '10up/phpfpm:5.6',
    '10up/phpfpm:5.5',
    '10up/wpsnapshots:dev',
    'memcached:latest',
    'nginx:latest',
    'docker.elastic.co/elasticsearch/elasticsearch:5.6.5',
    'hitwe/phpmemcachedadmin'
];

const help = function() {
    let help = `
Usage: 10updocker image update

Updates any docker images used by your environment to the latest versions available for the specified tag
`;
    console.log( help );
    process.exit();
};

const update = function( image ) {
    execSync( `docker pull ${image}`, { stdio: 'inherit' });
    console.log();
};

const updateIfUsed = function( image ) {
    console.log( `Testing ${image}` );
    let result = execSync( `docker image ls ${image} | wc -l`).toString();
    if ( result.trim() === '1' ) {
        console.log( `${image} doesn't exist on this system. Skipping update.` );
        return;
    }

    update( image );
};

const updateAll = function() {
    globalImages.map( update );
    images.map( updateIfUsed );
};

const command = async function() {
    switch ( commandUtils.subcommand() ) {
        case 'update':
            updateAll();
            console.log( 'done' );
            break;
        default:
            await help();
            break;
    }
};

module.exports = { command };
