const execSync = require('child_process').execSync;
const envUtils = require( './env-utils' );


const download = async function( env ) {
    let envPath = await envUtils.envPath( env );

    console.log( "Downloading WordPress" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core download --force"`, { stdio: 'inherit' });
};

const downloadDevelop = async function( env ) {
    let envPath = await envUtils.envPath( env );

    console.log( "Downloading WordPress Develop" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "git clone git://develop.git.wordpress.org/ ."`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker run -t --rm -v ${envPath}/wordpress:/usr/src/app -v ${envUtils.cacheVolume}:/var/www/.npm 10up/wpcorebuild:latest npm install`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker run -t --rm -v ${envPath}/wordpress:/usr/src/app 10up/wpcorebuild:latest grunt`, { stdio: 'inherit' });
};

const configure = async function( env ) {
    let envSlug = envUtils.envSlug( env );
    let envPath = await envUtils.envPath( env );

    console.log( "Configuring WordPress" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp config create --force --dbname=${envSlug}"`, { stdio: 'inherit' });
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

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core ${command} ${flags} --url=http://${envHost} --title=\\"${answers.title}\\" --admin_user=\\"${answers.username}\\" --admin_password=\\"${answers.password}\\" --admin_email=\\"${answers.email}\\""`, { stdio: 'inherit' });
};

const setRewrites = async function( env ) {
    let envPath = await envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp rewrite structure /%postname%/"`, { stdio: 'inherit' });
};

const emptyContent = async function( env ) {
    let envPath = await envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp site empty --yes"`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp plugin delete hello akismet"`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp theme delete twentyfifteen twentysixteen"`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2"`, { stdio: 'inherit' });
};

module.exports = { download, downloadDevelop, configure, install, setRewrites, emptyContent };
