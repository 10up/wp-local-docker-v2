const commandUtils = require( './command-utils' );
const path = require('path');
const fs = require( 'fs-extra' );
const yaml = require( 'write-yaml' );
const inquirer = require( 'inquirer' );
const promptValidators = require( './prompt-validators' );
const database = require( './database' );
const gateway = require( './gateway' );
const environment = require( './environment.js' );
const wordpress = require( './wordpress');
const envUtils = require( './env-utils' );
const sudo = require( 'sudo-prompt' );

const help = function() {
    let help = `
Usage: 10updocker create

Creates a new docker environment interactively.
`;
    console.log( help );
    process.exit();
};

const createEnv = async function() {
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
                    'phpfpm',
                    'memcacheadmin'
                ],
                'networks': [
                    'default',
                    'wplocaldocker'
                ],
                'environment': {
                    'CERT_NAME': 'localhost',
                    'HTTPS_METHOD': 'noredirect'
                }
            },
            'memcacheadmin': {
                'image': 'hitwe/phpmemcachedadmin',
                'expose': [
                    '80'
                ],
                'depends_on': [
                    'memcached'
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

    let questions = [
        {
            name: 'hostname',
            type: 'input',
            message: "What hostname would you like to use for your site? (Ex: docker.test)",
            validate: promptValidators.validateNotEmpty,
            filter: promptValidators.parseHostname,
        },
        {
            name: 'phpVersion',
            type: 'list',
            message: "What version of PHP would you like to use?",
            choices: [ '7.2', '7.1', '7.0', '5.6', '5.5' ],
            default: '7.2',
        },
        {
            name: 'elasticsearch',
            type: 'confirm',
            message: "Do you need Elasticsearch",
        },
        {
            name: 'wordpress',
            type: 'confirm',
            message: "Do you want to install WordPress?",
        },
        {
            name: 'wordpressType',
            type: 'list',
            message: "Select a WordPress installation type:",
            choices: [
                { name: "Single Site", value: "single" },
                { name: "Subdirectory Multisite", value: "subdirectory" },
                { name: "Subdomain Multisite", value: "subdomain" },
                { name: "Core Development Version", value: "dev" },
            ],
            default: 'single',
            when: function( answers ) {
                return answers.wordpress === true;
            }
        },
        {
            name: 'emptyContent',
            type: 'confirm',
            message: "Do you want to remove the default content?",
            when: function( answers ) {
                return answers.wordpress === true;
            }
        },
        {
            name: 'title',
            type: 'input',
            message: "Site Name",
            default: function( answers ) {
                return answers.hostname;
            },
            validate: promptValidators.validateNotEmpty,
            when: function( answers ) {
                return answers.wordpress === true;
            }
        },
        {
            name: 'username',
            type: 'input',
            message: "Admin Username",
            default: 'admin',
            validate: promptValidators.validateNotEmpty,
            when: function( answers ) {
                return answers.wordpress === true;
            }
        },
        {
            name: 'password',
            type: 'input',
            message: "Admin Password",
            default: 'password',
            validate: promptValidators.validateNotEmpty,
            when: function( answers ) {
                return answers.wordpress === true;
            }
        },
        {
            name: 'email',
            type: 'input',
            message: "Admin Email",
            default: 'admin@example.com',
            validate: promptValidators.validateNotEmpty,
            when: function( answers ) {
                return answers.wordpress === true;
            }
        },
    ];

    let answers = await inquirer.prompt( questions );

    // Folder name inside of /sites/ for this site
    let envHost = answers.hostname;
    let envSlug = envUtils.envSlug( envHost );
    let envPath = await envUtils.envPath( envHost );

    if ( await fs.exists( envPath ) === true ) {
        console.log();
        console.error( `Error: ${envHost} environment already exists. To recreate the environment, please delete it first by running \`10updocker delete ${envHost}\`` );
        process.exit(1);
    }

    await gateway.startGlobal();

    // Additional nginx config based on selections above
    baseConfig.services.nginx.environment.VIRTUAL_HOST = answers.hostname;

    if ( answers.wordpressType === 'subdomain' ) {
        baseConfig.services.nginx.environment.VIRTUAL_HOST += `,*.${answers.hostname}`;
    }
    // Map a different config for Develop version of WP
    if ( answers.wordpressType === 'dev' ) {
        baseConfig.services.nginx.volumes.push( './config/nginx/develop.conf:/etc/nginx/conf.d/default.conf' );
    } else {
        baseConfig.services.nginx.volumes.push( './config/nginx/default.conf:/etc/nginx/conf.d/default.conf' );
    }

    baseConfig.services.phpfpm = {
        'image': '10up/phpfpm:' + answers.phpVersion,
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
        ],
        'dns': [
            '10.0.0.2'
        ]
    };

    if ( answers.wordpressType == 'dev' ) {
        baseConfig.services.phpfpm.volumes.push('./config/php-fpm/wp-cli.develop.yml:/var/www/.wp-cli/config.yml');
    } else {
        baseConfig.services.phpfpm.volumes.push('./config/php-fpm/wp-cli.local.yml:/var/www/.wp-cli/config.yml');
    }

    if ( answers.elasticsearch === true ) {
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

    await fs.ensureDir( path.join( envPath, 'wordpress' ) );
    await fs.copy( path.join( envUtils.srcPath, 'config' ), path.join( envPath, 'config' ) );

    // Write Docker Compose
    console.log( "Generating docker-compose.yml file..." );
    let dockerCompose = Object.assign( baseConfig, networkConfig, volumeConfig );
    await new Promise( resolve => {
        yaml( path.join( envPath, 'docker-compose.yml' ), dockerCompose, { 'lineWidth': 500 }, function( err ) {
            if ( err ) {
                console.log(err);
            }
            console.log( 'done' );
            resolve();
        });
    });

    // Create database
    console.log( "Creating database" );
    await database.create( envSlug );
    await database.assignPrivs( envSlug );

    await environment.start( envSlug );

    if ( answers.wordpress === true ) {
        if ( answers.wordpressType === 'dev' ) {
            await wordpress.downloadDevelop( envSlug );
        } else {
            await wordpress.download( envSlug );
        }

        await wordpress.configure( envSlug );

        await wordpress.install( envSlug, envHost, answers );

        await wordpress.setRewrites( envSlug );

        if ( answers.emptyContent === true ) {
            await wordpress.emptyContent( envSlug );
        }
    }

    console.log( 'Adding entry to hosts file' );
    let sudoOptions = {
        name: "WP Local Docker"
    };
    await new Promise( resolve => {
        sudo.exec( `10updocker-hosts add ${envHost}`, sudoOptions, function( error, stdout, stderr ) {
            if (error) throw error;
            console.log(stdout);
            resolve();
        });
    });

    // Track things we might need to know later in order to clean up the environment
    let envConfig = {
        'envHosts': [ envHost ]
    };
    await fs.writeJson( path.join( envPath, '.config.json' ), envConfig );

    console.log();
    console.log( "Successfully Created Site!");

    if ( answers.wordpressType === 'subdomain' ) {
        console.log( "Note: Subdomain multisites require any additional subdomains to be added manually to your hosts file!");
    }
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
