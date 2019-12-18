const execSync = require('child_process').execSync;
const envUtils = require( './env-utils' );


const download = async function( env ) {
    let envPath = await envUtils.envPath( env );

    console.log( "Downloading WordPress" );
    execSync( `docker-compose exec phpfpm wp core download --force`, { stdio: 'inherit', cwd: envPath });
};

const downloadDevelop = async function( env ) {
    let envPath = await envUtils.envPath( env );

    console.log( "Downloading WordPress Develop" );
    execSync( `docker-compose exec phpfpm git clone git://develop.git.wordpress.org/ .`, { stdio: 'inherit', cwd: envPath });
    execSync( `docker run -t --rm -v ${envPath}/wordpress:/usr/src/app -v ${envUtils.cacheVolume}:/var/www/.npm 10up/wpcorebuild:latest npm install`, { stdio: 'inherit', cwd: envPath });
    execSync( `docker run -t --rm -v ${envPath}/wordpress:/usr/src/app 10up/wpcorebuild:latest grunt`, { stdio: 'inherit', cwd: envPath });
};

const configure = async function( env ) {
    let envSlug = envUtils.envSlug( env );
    let envPath = await envUtils.envPath( env );

    console.log( "Configuring WordPress" );
    execSync( `docker-compose exec phpfpm wp config create --force --dbname=${envSlug} --dbuser=wordpress --dbpass=password --dbhost=mysql`, { stdio: 'inherit', cwd: envPath });
};

const install = async function( env, envHost, answers ) {
    let envPath = await envUtils.envPath( env );
    let command = '';
    let flags = '';

    switch ( answers.wordpressType ) {
        case 'single':
        case 'dev':
            command = 'install';
            break;
        case 'subdirectory':
            command = 'multisite-install';
            break;
        case 'subdomain':
            command = 'multisite-install';
            flags = '--subdomains';
            break;
        default:
            throw Error( "Invalid Installation Type" );
            break;
    }

    execSync( `docker-compose exec phpfpm wp core ${command} ${flags} --url=http://${envHost} --title="${answers.title}" --admin_user="${answers.username}" --admin_password="${answers.password}" --admin_email="${answers.email}"`, { stdio: 'inherit', cwd: envPath });
};

const setRewrites = async function( env ) {
    let envPath = await envUtils.envPath( env );

    execSync( `docker-compose exec phpfpm wp rewrite structure /%postname%/`, { stdio: 'inherit', cwd: envPath });
};

const emptyContent = async function( env ) {
    let envPath = await envUtils.envPath( env );

    execSync( `docker-compose exec phpfpm wp site empty --yes`, { stdio: 'inherit', cwd: envPath });
    execSync( `docker-compose exec phpfpm wp plugin delete hello akismet`, { stdio: 'inherit', cwd: envPath });
    execSync( `docker-compose exec phpfpm wp theme delete twentyfifteen twentysixteen`, { stdio: 'inherit', cwd: envPath });
    execSync( `docker-compose exec phpfpm wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2`, { stdio: 'inherit', cwd: envPath });
};

module.exports = { download, downloadDevelop, configure, install, setRewrites, emptyContent };
