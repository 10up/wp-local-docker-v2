#!/usr/bin/env node

if ( require.main.filename.indexOf( 'index.js' ) === -1 ) {
    process.exit(1);
}

const path = require('path');
const fs = require( 'fs-extra' );
const slugify = require('@sindresorhus/slugify');
const yaml = require( 'write-yaml' );
const prompt = require( 'prompt' );
const mysql = require('mysql');
const environment = require( './environment.js' );
const wordpress = require( './wordpress');

// Setup some paths for reference later
const rootPath = path.dirname( require.main.filename );
const sitesPath = path.join( rootPath, 'sites' );

var baseConfig = {
    'version': '3',
    'services': {
        'memcached': {
            'image': 'memcached:latest',
            'restart': 'unless-stopped'
        },
        'nginx': {
            'image': 'nginx:latest',
            'restart': 'unless-stopped',
            'expose': [
                "80",
                "443"
            ],
            'volumes': [
                './wordpress:/var/www/html',
                './config/nginx/default.conf:/etc/nginx/conf.d/default.conf',
                './config/certs:/etc/nginx/certs',
                './logs/nginx:/var/log/nginx'
            ],
            'depends_on': [
                'phpfpm'
            ],
            'networks': [
                'default',
                'wplocaldocker'
            ]
        },
        'wpsnapshots': {
            'image': '10up/wpsnapshots:latest',
            'volumes': [
                './config/wpsnapshots:/wpsnapshots',
                './wordpress:/var/www/html'
            ],
            'depends_on': [
                'phpfpm'
            ]
        },
    }
};

var networkConfig = {
    'networks': {
        'wplocaldocker': {
            'external': {
                'name': 'wplocaldocker'
            }
        }
    }
};

prompt.start();

var validateBool = function( value ) {
    var y = new RegExp( /^y(es)?$/i );
    var n = new RegExp( /^no?$/i );

    if ( typeof value !== 'string' ) {
        return value;
    }

    if ( value.match( y ) !== null ) {
        return 'true';
    } else if ( value.match( n ) !== null ) {
        return 'false';
    }

    return value;
};

/*
Not foolproof, but should catch some more common issues with entering hostnames
 */
var parseHostname = function( value ) {
    // Get rid of any http(s):// prefix
    value = value.replace( /^https?:\/\//i, '' );

    // Get rid of any spaces
    value = value.replace( /\s/i, '' );

    // get rid of any trailing slashes that might exist
    value = value.replace( /\/$/i, '' );

    return value;
};

var prompts = {
    properties: {
        hostname: {
            description: "What hostname would you like to use for your site? (Ex: docker.test)",
            message: "You must choose a hostname for your site.",
            type: 'string',
            required: true,
            before: parseHostname,
        },
        phpVersion: {
            description: "What version of PHP would you like to use? [5.5, 5.6, 7.0, 7.1, 7.2]",
            message: "You must select one of 5.5, 5.6, 7.0, 7.1, or 7.2",
            type: 'string',
            required: true,
            default: '7.2',
            enum: [ '5.5', '5.6', '7.0', '7.1', '7.2' ],
        },
        elasticsearch: {
            description: "Do you need Elasticsearch? (Y/n)",
            //type: 'boolean', // Doesn't allow Y/n
            message: "You must choose either `Y` or `n`",
            type: 'string',
            required: true,
            default: 'Y',
            enum: [ 'Y', 'y', 'N', 'n' ],
            before: validateBool,
        },
        phpmemcachedadmin: {
            description: "Do you want to use phpMemcachedAdmin? (Y/n)",
            message: "You must choose either `Y` or `n`",
            type: 'string',
            required: true,
            default: 'n',
            enum: [ 'Y', 'y', 'N', 'n' ],
            before: validateBool,
        }
    },
};

prompt.get( prompts, function( err, result ) {
    if ( err ) {
        console.log(''); // so we don't end up cursor on the old prompt line
        return;
    }

    baseConfig.services.nginx.environment = {
        VIRTUAL_HOST: result.hostname
    };

    baseConfig.services.phpfpm = {
        'image': '10up/phpfpm:' + result.phpVersion,
        'restart': 'unless-stopped',
        'volumes': [
            './wordpress:/var/www/html',
            './config/php-fpm/php.ini:/usr/local/etc/php/php.ini',
            './config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini',
            './config/php-fpm/wp-cli.local.yml:/var/www/wp-cli.local.yml',
            '~/.ssh:/root/.ssh'
        ],
        'depends_on': [
            'memcached',
        ],
        'networks': [
            'default',
            'wplocaldocker'
        ]
    };

    if ( result.elasticsearch === 'true' ) {
        baseConfig.services.phpfpm.depends_on.push( 'elasticsearch' );

        baseConfig.services.elasticsearch = {
            image: 'docker.elastic.co/elasticsearch/elasticsearch:5.6.5',
            'restart': 'unless-stopped',
            'ports': [
                '9200:9200'
            ],
            'volumes': [
                './config/elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml',
                './config/elasticsearch/plugins:/usr/share/elasticsearch/plugins'
            ],
            'environment': {
                ES_JAVA_OPTS: '-Xms750m -Xmx750m'
            }
        };
    }

    // Create webroot/config
    console.log( "Copying required files..." );

    // Folder name inside of /sites/ for this site
    let hostSlug = slugify( result.hostname );
    let envPath = path.join( sitesPath, hostSlug );

    fs.ensureDirSync( path.join( envPath, 'wordpress' ) );
    fs.ensureDirSync( path.join( envPath, 'logs', 'nginx' ) );
    fs.copySync( path.join( __dirname, 'config' ), path.join( envPath, 'config' ) );

    // Write Docker Compose
    console.log( "Generating docker-compose.yml file..." );
    let dockerCompose = Object.assign( baseConfig, networkConfig );
    yaml.sync( path.join( envPath, 'docker-compose.yml' ), dockerCompose, { 'lineWidth': 500 }, function( err ) {
        if ( err ) {
            console.log(err);
        }
    });

    // Create database
    console.log( "Creating database" );
    let connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'password',
    });

    connection.query( `CREATE DATABASE IF NOT EXISTS \`${hostSlug}\`;`, function( err, results ) {
        if (err) {
            console.log('error in creating database', err);
            process.exit();
            return;
        }

        connection.query( `GRANT ALL PRIVILEGES ON \`${hostSlug}\`.* TO 'wordpress'@'%' IDENTIFIED BY 'password';`, function( err, results ) {
            if ( err ) {
                console.log('error in creating database', err);
                process.exit();
                return;
            }
            connection.destroy();

            environment.start(hostSlug);
            wordpress.download(hostSlug);
            wordpress.configure(hostSlug);
            wordpress.install(hostSlug, result.hostname);
        } );
    } );
});


// prompt:
// wpsnapshots snapshot ID

// Add update checker?
// - check for update to this project
// - check for docker image updates
