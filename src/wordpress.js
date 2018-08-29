const path = require('path');
const slugify = require('@sindresorhus/slugify');
const execSync = require('child_process').execSync;

// Setup some paths for reference later
const rootPath = path.dirname( require.main.filename );
const sitesPath = path.join( rootPath, 'sites' );

const download = function( env ) {
    // Folder name inside of /sites/ for this site
    let hostSlug = slugify( env );
    let envPath = path.join( sitesPath, hostSlug );

    console.log( "Downloading WordPress" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core download --force"`, { stdio: 'inherit' });
};

const configure = function( env ) {
    // Folder name inside of /sites/ for this site
    let hostSlug = slugify( env );
    let envPath = path.join( sitesPath, hostSlug );

    console.log( "Configuring WordPress" );
    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp config create --force --dbname=${hostSlug}"`, { stdio: 'inherit' });
};

const install = function( env, hostname ) {
    // Folder name inside of /sites/ for this site
    let hostSlug = slugify( env );
    let envPath = path.join( sitesPath, hostSlug );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core install --url=http://${hostname} --prompt=title,admin_user,admin_password,admin_email"`, { stdio: 'inherit' });
};

// Splitting these out, because --prompt=subdomains doesn't actually spit out that prompt for some reason
// @todo file bug report on wp-cli for this
// Fair warning... Once this is fixed in wp-cli, these two functions will be consolidated to one installMultisite, with a prompt for --subdirectories in wp-cli
const installMultisiteSubdirectories = function( env, hostname ) {
    // Folder name inside of /sites/ for this site
    let hostSlug = slugify( env );
    let envPath = path.join( sitesPath, hostSlug );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core multisite-install --url=http://${hostname} --prompt=title,admin_user,admin_password,admin_email"`, { stdio: 'inherit' });
};

const installMultisiteSubdomains = function( env, hostname ) {
    // Folder name inside of /sites/ for this site
    let hostSlug = slugify( env );
    let envPath = path.join( sitesPath, hostSlug );

    execSync( `cd ${envPath} && docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core multisite-install --url=http://${hostname} --subdomains --prompt=title,admin_user,admin_password,admin_email"`, { stdio: 'inherit' });
};

module.exports = { download, configure, install, installMultisiteSubdomains, installMultisiteSubdirectories };
