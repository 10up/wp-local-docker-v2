const execSync = require('child_process').execSync;
const envUtils = require( './env-utils' );


const download = function( env ) {
    let envPath = envUtils.envPath( env );

    console.log( "Downloading WordPress" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core download --force"`, { stdio: 'inherit' });
};

const downloadDevelop = function( env ) {
    let envPath = envUtils.envPath( env );

    console.log( "Downloading WordPress Develop" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "git clone git://develop.git.wordpress.org/ ."`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker run -t --rm -v ${envPath}/wordpress:/usr/src/app -v ${envUtils.cacheVolume}:/root/.npm 10up/wpcorebuild:latest npm install`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker run -t --rm -v ${envPath}/wordpress:/usr/src/app 10up/wpcorebuild:latest grunt`, { stdio: 'inherit' });
};

const configure = function( env ) {
    let envSlug = envUtils.envSlug( env );
    let envPath = envUtils.envPath( env );

    console.log( "Configuring WordPress" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp config create --force --dbname=${envSlug}"`, { stdio: 'inherit' });
};

const install = function( env, envHost ) {
    let envPath = envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core install --url=http://${envHost} --prompt=title,admin_user,admin_password,admin_email"`, { stdio: 'inherit' });
};

// Splitting these out, because --prompt=subdomains doesn't actually spit out that prompt for some reason
// @todo file bug report on wp-cli for this
// Fair warning... Once this is fixed in wp-cli, these two functions will be consolidated to one installMultisite, with a prompt for --subdirectories in wp-cli
const installMultisiteSubdirectories = function( env, envHost ) {
    let envPath = envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core multisite-install --url=http://${envHost} --prompt=title,admin_user,admin_password,admin_email"`, { stdio: 'inherit' });
};

const installMultisiteSubdomains = function( env, envHost ) {
    let envPath = envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core multisite-install --url=http://${envHost} --subdomains --prompt=title,admin_user,admin_password,admin_email"`, { stdio: 'inherit' });
};

const setRewrites = function( env ) {
    let envPath = envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c 'wp rewrite structure "/%postname%/"'`, { stdio: 'inherit' });
};

const emptyContent = function( env ) {
    let envPath = envUtils.envPath( env );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c 'wp site empty --yes'`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c 'wp plugin delete hello akismet'`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c 'wp theme delete twentyfifteen twentysixteen'`, { stdio: 'inherit' });
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c 'wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2'`, { stdio: 'inherit' });
};

module.exports = { download, downloadDevelop, configure, install, installMultisiteSubdomains, installMultisiteSubdirectories, setRewrites, emptyContent };
