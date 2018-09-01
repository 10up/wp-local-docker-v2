const commandUtils = require( './command-utils' );
const path = require('path');
const fs = require( 'fs-extra' );
const yaml = require( 'write-yaml' );
const prompt = require( 'prompt' );
const promptValidators = require( './prompt-validators' );
const mysql = require('mysql');
const gateway = require( './gateway' );
const environment = require( './environment.js' );
const wordpress = require( './wordpress');
const envUtils = require( './env-utils' );

const help = function() {
    let help = `
Usage: 10updocker create

Creates a new docker environment interactively.
`;
    console.log( help );
    process.exit();
};

const createEnv = function() {
    var baseConfig = {
        'version': '3',
        'services': {
            'memcached': {
                'image': 'memcached:latest'
            },
            'nginx': {
                'image': 'nginx:latest',
                'expose': [
                    "80",
                    "443"
                ],
                'volumes': [
                    './wordpress:/var/www/html'
                ],
                'depends_on': [
                    'phpfpm'
                ],
                'networks': [
                    'default',
                    'wplocaldocker'
                ]
            }
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

    var volumeConfig = {
        'volumes': {}
    };
    volumeConfig.volumes[ envUtils.cacheVolume ] = {
        'external': {
            'name': `${envUtils.cacheVolume}`
        }
    };

    prompt.start();

    var prompts = {
        properties: {
            hostname: {
                description: "What hostname would you like to use for your site? (Ex: docker.test)",
                message: "You must choose a hostname for your site.",
                type: 'string',
                required: true,
                before: promptValidators.parseHostname,
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
                before: promptValidators.validateBool,
            },
            wordpress: {
                description: "Do you want to install WordPress? (Y/n)",
                message: "You must choose either `Y` or `n`",
                type: 'string',
                required: true,
                default: 'Y',
                enum: [ 'Y', 'y', 'N', 'n' ],
                before: promptValidators.validateBool,
            },
            wordpressDev: {
                description: "Would you like to install WordPress for core development? (Y/n)",
                message: "You must choose either `Y` or `n`",
                type: 'string',
                required: true,
                default: 'n',
                enum: [ 'Y', 'y', 'N', 'n' ],
                before: promptValidators.validateBool,
                ask: function() {
                    // only ask if install WordPress was true
                    return prompt.history('wordpress').value === "true";
                }
            },
            wordpressMultisite: {
                description: "Would you like to install WordPress multisite? (Y/n)",
                message: "You must choose either `Y` or `n`",
                type: 'string',
                required: true,
                default: 'n',
                enum: [ 'Y', 'y', 'N', 'n' ],
                before: promptValidators.validateBool,
                ask: function() {
                    // only ask if install WordPress was true and dev was false
                    return prompt.history('wordpress').value === "true" && prompt.history('wordpressDev').value === "false";
                }
            },
            subdomains: {
                description: "Would you like a subdomain install? Defaults to subdirectories. (Y/n)",
                message: "You must choose either `Y` or `n`",
                type: 'string',
                required: true,
                default: 'n',
                enum: [ 'Y', 'y', 'N', 'n' ],
                before: promptValidators.validateBool,
                ask: function() {
                    // only ask if install WordPress was true and dev was false
                    return prompt.history('wordpress').value === 'true' && prompt.history('wordpressDev').value === 'false' && prompt.history('wordpressMultisite').value === "true";
                }
            },
            emptyContent: {
                description: "Would you like to remove the default content? (Y/n)",
                message: "You must choose either `Y` or `n`",
                type: 'string',
                required: true,
                default: 'y',
                enum: [ 'Y', 'y', 'N', 'n' ],
                before: promptValidators.validateBool,
                ask: function() {
                    // only ask if install WordPress was true
                    return prompt.history('wordpress').value === "true";
                }
            },
        },
    };

    prompt.get( prompts, async function( err, result ) {
        if ( err ) {
            console.log(''); // so we don't end up cursor on the old prompt line
            process.exit(1);
        }

        await gateway.startGlobal();

        // Additional nginx config based on selections above
        baseConfig.services.nginx.environment = {
            VIRTUAL_HOST: result.hostname
        };
        if ( result.subdomains === 'true' ) {
            baseConfig.services.nginx.environment.VIRTUAL_HOST += `,*.${result.hostname}`;
        }
        // Map a different config for Develop version of WP
        if ( result.wordpressDev === 'true' ) {
            baseConfig.services.nginx.volumes.push( './config/nginx/develop.conf:/etc/nginx/conf.d/default.conf' );
        } else {
            baseConfig.services.nginx.volumes.push( './config/nginx/default.conf:/etc/nginx/conf.d/default.conf' );
        }

        baseConfig.services.phpfpm = {
            'image': '10up/phpfpm:' + result.phpVersion,
            'volumes': [
                './wordpress:/var/www/html',
                './config/php-fpm/php.ini:/usr/local/etc/php/php.ini',
                './config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini',
                `${envUtils.cacheVolume}:/var/www/.wp-cli/cache`,
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

        if ( result.wordpressDev == 'true' ) {
            baseConfig.services.phpfpm.volumes.push('./config/php-fpm/wp-cli.develop.yml:/var/www/.wp-cli/config.yml');
        } else {
            baseConfig.services.phpfpm.volumes.push('./config/php-fpm/wp-cli.local.yml:/var/www/.wp-cli/config.yml');
        }

        if ( result.elasticsearch === 'true' ) {
            baseConfig.services.phpfpm.depends_on.push( 'elasticsearch' );

            baseConfig.services.elasticsearch = {
                image: 'docker.elastic.co/elasticsearch/elasticsearch:5.6.5',
                'expose': [
                    '9200'
                ],
                'volumes': [
                    './config/elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml',
                    './config/elasticsearch/plugins:/usr/share/elasticsearch/plugins',
                    'elasticsearchData:/usr/share/elasticsearch/data:delegated'
                ],
                'environment': {
                    ES_JAVA_OPTS: '-Xms750m -Xmx750m'
                }
            };

            volumeConfig.volumes.elasticsearchData = {};
        }

        // Create webroot/config
        console.log( "Copying required files..." );

        // Folder name inside of /sites/ for this site
        let envHost = result.hostname;
        let envSlug = envUtils.envSlug( envHost );
        let envPath = envUtils.envPath( envHost );

        fs.ensureDirSync( path.join( envPath, 'wordpress' ) );
        fs.ensureDirSync( path.join( envPath, 'logs', 'nginx' ) );
        fs.copySync( path.join( envUtils.srcPath, 'config' ), path.join( envPath, 'config' ) );

        // Write Docker Compose
        console.log( "Generating docker-compose.yml file..." );
        let dockerCompose = Object.assign( baseConfig, networkConfig, volumeConfig );
        yaml.sync( path.join( envPath, 'docker-compose.yml' ), dockerCompose, { 'lineWidth': 500 }, function( err ) {
            if ( err ) {
                console.log(err);
            }
        });

        // Create database
        // @todo clean up/abstract to a database file
        console.log( "Creating database" );
        let connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'password',
        });

        connection.query( `CREATE DATABASE IF NOT EXISTS \`${envSlug}\`;`, function( err, results ) {
            if (err) {
                console.log('error in creating database', err);
                process.exit(1);
                return;
            }

            connection.query( `GRANT ALL PRIVILEGES ON \`${envSlug}\`.* TO 'wordpress'@'%' IDENTIFIED BY 'password';`, async function( err, results ) {
                if ( err ) {
                    console.log('error in creating database', err);
                    process.exit(1);
                    return;
                }
                connection.destroy();

                await environment.start( envSlug );

                if ( result.wordpress === 'true' ) {
                    if ( result.wordpressDev === 'true' ) {
                        wordpress.downloadDevelop( envSlug );
                    } else {
                        wordpress.download( envSlug );
                    }

                    wordpress.configure( envSlug );

                    if ( result.wordpressMultisite === 'true' ) {
                        if ( result.subdomains === 'true' ) {
                            wordpress.installMultisiteSubdomains( envSlug, envHost );
                        } else {
                            wordpress.installMultisiteSubdirectories( envSlug, envHost );
                        }
                    } else {
                        wordpress.install( envSlug, envHost );
                    }

                    wordpress.setRewrites( envSlug );

                    if ( result.emptyContent === 'true' ) {
                        wordpress.emptyContent( envSlug );
                    }
                }
            } );
        } );
    });
};

const command = async function() {
    switch ( commandUtils.subcommand() ) {
        case 'help':
            help();
            break;
        default:
            await createEnv();
            break;
    }
};

module.exports = { command, help };
