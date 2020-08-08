const { validateNotEmpty, parseHostname, parseProxyUrl } = require( '../../prompt-validators' );
const { createDefaultProxy } = require( '../../env-utils' );

module.exports = function makeInquirer( inquirer ) {
	return async () => {
		const answers = await inquirer.prompt( [
			{
				name: 'projectName',
				type: 'input',
				message: 'What is the name of the project?',
				validate: validateNotEmpty,
			},
			{
				name: 'hostname',
				type: 'input',
				message: 'What is the primary hostname for your site? (Ex: docker.test)',
				validate: validateNotEmpty,
				filter: parseHostname,
			},
			{
				name: 'addMoreHosts',
				type: 'confirm',
				message: 'Are there additional domains the site should respond to?',
				default: false,
			},
			{
				name: 'extraHosts',
				type: 'input',
				message: 'Enter additional hostnames separated by spaces (Ex: docker1.test docker2.test)',
				filter( value ) {
					return value
						.split( ' ' )
						.map( ( value ) => value.trim() )
						.filter( ( value ) => value.length > 0 )
						.map( parseHostname );
				},
				when( answers ) {
					return answers.addMoreHosts === true;
				},
			},
			{
				name: 'phpVersion',
				type: 'list',
				message: 'What version of PHP would you like to use?',
				choices: [ '7.4', '7.3', '7.2', '7.1', '7.0', '5.6' ],
				default: '7.3',
			},
			{
				name: 'wordpress',
				type: 'confirm',
				message: 'Do you want to install WordPress?',
			},
			{
				name: 'wordpressType',
				type: 'list',
				message: 'Select a WordPress installation type:',
				choices: [
					{ name: 'Single Site', value: 'single' },
					{ name: 'Subdirectory Multisite', value: 'subdirectory' },
					{ name: 'Subdomain Multisite', value: 'subdomain' },
					{ name: 'Core Development Version', value: 'dev' },
				],
				default: 'single',
				when( answers ) {
					return answers.wordpress === true;
				},
			},
			{
				name: 'title',
				type: 'input',
				message: 'Site Name',
				default( { hostname } ) {
					return hostname;
				},
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true;
				},
			},
			{
				name: 'username',
				type: 'input',
				message: 'Admin Username',
				default: 'admin',
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true;
				},
			},
			{
				name: 'password',
				type: 'input',
				message: 'Admin Password',
				default: 'password',
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true;
				},
			},
			{
				name: 'email',
				type: 'input',
				message: 'Admin Email',
				default: 'admin@example.com',
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true;
				},
			},
			{
				name: 'emptyContent',
				type: 'confirm',
				message: 'Do you want to remove the default content?',
				default: false,
				when( answers ) {
					return answers.wordpress === true;
				},
			},
			{
				name: 'mediaProxy',
				type: 'confirm',
				message: 'Do you want to set a proxy for media assets? (i.e. Serving /uploads/ directory assets from a production site)',
				default: false,
			},
			{
				name: 'proxy',
				type: 'input',
				message: 'Proxy URL',
				default( { hostname } ) {
					return createDefaultProxy( hostname );
				},
				validate: validateNotEmpty,
				filter: parseProxyUrl,
				when( answers ) {
					return answers.mediaProxy === true;
				},
			},
			{
				name: 'elasticsearch',
				type: 'confirm',
				message: 'Do you need Elasticsearch',
				default: false,
			},
			{
				name: 'snapshot',
				type: 'input',
				message: 'Do you want to use a snapshot? Leave empty if you don\'t need it.',
			},
			{
				name: 'mountPoint',
				type: 'input',
				message: 'Where do you to mount the project?',
				default: '/wp-content',
			},
		] );

		let domain = answers.hostname;
		if ( Array.isArray( answers.extraHosts ) ) {
			domain = Array.from( new Set( [
				answers.hostname,
				...answers.extraHosts,
			] ) );
		}

		return {
			...answers,
			proxy: answers.proxy || answers.mediaProxy,
			domain,
		};
	};
};
