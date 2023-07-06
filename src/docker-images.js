// These have to exist, so we don't bother checking if they exist on the system first
exports.globalImages = {
	'nginx-proxy': 'jwilder/nginx-proxy:alpine',
	mysql: 'mariadb:10.3',
	mailcatcher: 'schickling/mailcatcher',
	phpmyadmin: 'phpmyadmin',
};

exports.images = {
	'php8.2': '10up/wp-php-fpm-dev:8.2-ubuntu',
	'php8.1': '10up/wp-php-fpm-dev:8.1-ubuntu',
	'php8.0': '10up/wp-php-fpm-dev:8.0-ubuntu',
	'php7.4': '10up/wp-php-fpm-dev:7.4-ubuntu',
	'php7.3': '10up/wp-php-fpm-dev:7.3-ubuntu',
	'php7.2': '10up/wp-php-fpm-dev:7.2-ubuntu',
	'php7.1': '10up/wp-php-fpm-dev:7.1-ubuntu',
	'php7.0': '10up/wp-php-fpm-dev:7.0-ubuntu',
	'php5.6': '10up/wp-php-fpm-dev:5.6-ubuntu',
	memcached: 'memcached:latest',
	nginx: 'nginx:latest',
	elasticsearch: 'docker.elastic.co/elasticsearch/elasticsearch:7.9.3',
};
