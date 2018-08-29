#!/usr/bin/env node

if ( require.main.filename.indexOf( 'index.js' ) === -1 ) {
    process.exit(1);
}

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

module.exports = { download, configure, install };
