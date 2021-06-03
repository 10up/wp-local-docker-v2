// These have to exist, so we don't bother checking if they exist on the system first
exports.globalImages = {
	'nginx-proxy': '10up/nginx-proxy:latest',
	mysql: 'mysql:5',
	mailcatcher: 'schickling/mailcatcher',
	phpmyadmin: 'phpmyadmin/phpmyadmin',
};

exports.images = {
	'php7.4': '10up/wp-php-fpm-dev:7.4',
	'php7.3': '10up/wp-php-fpm-dev:7.3',
	'php7.2': '10up/wp-php-fpm-dev:7.2',
	'php7.1': '10up/wp-php-fpm-dev:7.1',
	'php7.0': '10up/wp-php-fpm-dev:7.0',
	'php5.6': '10up/wp-php-fpm-dev:5.6',
	wpsnapshots: '10up/wpsnapshots:2',
	memcached: 'memcached:latest',
	nginx: 'nginx:latest',
	elasticsearch: 'docker.elastic.co/elasticsearch/elasticsearch:5.6.16',
};
