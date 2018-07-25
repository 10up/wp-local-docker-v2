var yaml = require( 'write-yaml' );

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
			'image': 'schickling/mailcatcher',
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

// prompt:
// phpfpm version
// elasticsearch
// wpsnapshots snapshot ID
//
// Extra:
// mailcatcher
// phpmyadmin
// phpmemcachedadmin

// Create directories:
// ./wordpress
// ./data (mysql)
// ./config
// ./logs

// Add update checker?

yaml( 'docker-compose.yml', baseConfig, function( err ) {
	console.log(err);
});

