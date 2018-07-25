#!/usr/bin/env node

var yaml = require( 'write-yaml' );
var prompt = require( 'prompt' );
var fs = require( 'fs-extra' );

var baseConfig = {
	'version': '3',
	'services': {
		'mysql': {
			'image': 'mysql:5',
			'volumes': [
				'./data/db:/var/lib/mysql'
			],
			'restart': 'unless-stopped',
			'ports': [
				'3306:3306'
			],
			'environment': {
				MYSQL_ROOT_PASSWORD: 'password',
				MYSQL_DATABASE: 'wordpress',
				MYSQL_USER: 'wordpress',
				MYSQL_PASSWORD: 'password'
			}
		},
		'memcached': {
			'image': 'memcached:latest',
			'restart': 'unless-stopped'
		},
		'nginx': {
			'image': 'nginx:latest',
			'restart': 'unless-stopped',
			'ports': [
				"80:80",
				"443:443"
			],
			'volumes': [
				'./wordpress:/var/www/html',
				'./config/nginx/default.conf:/etc/nginx/conf.d/default.conf',
				'./config/certs:/etc/nginx/certs',
				'./logs/nginx:/var/log/nginx'
			],
			'depends_on': [
				'phpfpm'
			]
		},
		'wpsnapshots': {
			'image': '10up/wpsnapshots:latest',
			'volumes': [
				'./config/wpsnapshots:/wpsnapshots',
				'./wordpress:/var/www/html'
			],
			'depends_on': [
				'mysql',
				'phpfpm'
			]
		},
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
}

var schema = {
	properties: {
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
		mailcatcher: {
			description: "Do you want to use mailcatcher? (Y/n)",
			message: "You must choose either `Y` or `n`",
			type: 'string',
			required: true,
			default: 'Y',
			enum: [ 'Y', 'y', 'N', 'n' ],
			before: validateBool,
		},
		phpmyadmin: {
			description: "Do you want to use phpMyAdmin? (Y/n)",
			message: "You must choose either `Y` or `n`",
			type: 'string',
			required: true,
			default: 'n',
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

prompt.get( schema, function( err, result ) {
	if ( err ) {
		console.log(''); // so we don't end up cursor on the old prompt line
		return;
	}
	
	baseConfig.services.phpfpm = {
		'image': '10up/phpfpm:' + result.phpVersion,
		'restart': 'unless-stopped',
		'volumes': [
			'./wordpress:/var/www/html',
			'./config/php-fpm/php.ini:/usr/local/etc/php/php.ini',
			'./config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini',
			'./config/php-fpm/wp-cli.local.yml:/var/www/html/wp-cli.local.yml',
			'~/.ssh:/root/.ssh'
		],
		'depends_on': [
			'mysql',
			'memcached',
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

	if ( result.mailcatcher === "true" ) {
		baseConfig.services.mailcatcher = {
			'image': 'schickling/mailcatcher',
			'restart': 'unless-stopped',
			'ports': [
				'1025:1025',
				'1080:1080'
			],
			'environment': {
				MAILCATCHER_PORT: 1025
			}
		};
	}

	if ( result.phpmyadmin === "true" ) {
		baseConfig.services.phpmyadmin = {
			'image': 'phpmyadmin/phpmyadmin',
			'restart': 'unless-stopped',
			'ports': [
				'8092:80'
			],
			'environment': {
				MYSQL_ROOT_PASSWORD: 'password',
				MYSQL_DATABASE: 'wordpress',
      				MYSQL_USER: 'wordpress',
      				MYSQL_PASSWORD: 'password',
				PMA_HOST: 'mysql'
			},
			'depends_on': [
				'mysql'
			]
		};
	}

	if ( result.phpmemcachedadmin === "true" ) {
		baseConfig.services.phpmemcachedadmin = {
			'image': 'hitwe/phpmemcachedadmin',
			'restart': 'unless-stopped',
			'ports': [
				'8093:80'
			],
			'depends_on': [
				'memcached'
			]
		};
	}
	
	// Write Docker Compose
	console.log( "Generating docker-compose.yml file..." );
	yaml( 'docker-compose.yml', baseConfig, { 'lineWidth': 500 }, function( err ) {
		console.log(err);
	});

	// Create webroot/config
	console.log( "Copying required files..." );
	console.log( process.cwd() );
	fs.copySync( __dirname + '/wordpress', process.cwd() + '/wordpress' );
	fs.copySync( __dirname + '/data', process.cwd() + '/data' );     
	fs.copySync( __dirname + '/config', process.cwd() + '/config' );     
	fs.copySync( __dirname + '/logs', process.cwd() + '/logs' );     
});


// prompt:
// wpsnapshots snapshot ID

// Add update checker?
// - check for update to this project
// - check for docker image updates


