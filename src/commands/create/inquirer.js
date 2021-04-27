const { validateNotEmpty, parseHostname, parseProxyUrl } = require( '../../prompt-validators' );
const { createDefaultProxy } = require( '../../env-utils' );

const phpVersions = [
	'7.4',
	'7.3',
	'7.2',
	'7.1',
	'7.0',
	'5.6',
];

const wordpressTypes = [
	{ name: 'Single Site', value: 'single' },
	{ name: 'Subdirectory Multisite', value: 'subdirectory' },
	{ name: 'Subdomain Multisite', value: 'subdomain' },
	{ name: 'Core Development Version', value: 'dev' },
];

function defaultIsUndefined( val ) {
	return () => typeof val === 'undefined';
}

function marshalDomains( original, { hostname, extraHosts, wordpressType } ) {
	const collection = new Set();

	if ( Array.isArray( original ) ) {
		original.forEach( collection.add, collection );
	} else if ( typeof original === 'string' ) {
		collection.add( original );
	}

	if ( hostname ) {
		collection.add( hostname );
		if ( wordpressType === 'dev' ) {
			collection.add( `build.${ hostname }` );
		}
	}

	if ( Array.isArray( extraHosts ) ) {
		extraHosts.forEach( collection.add, collection );
	}

	const domains = Array.from( collection );

	return domains.length === 1 ? domains[0] : domains;
}

function marshalWordPress( original, answers ) {
	let wp = original || answers.wordpress;
	if ( wp === true ) {
		wp = {};
	}

	[ 'title', 'username', 'password', 'email' ].forEach( ( key ) => {
		if ( answers[key] ) {
			wp[ key ] = answers[ key ];
		}
	} );

	if ( answers.wordpressType ) {
		wp.type = answers.wordpressType;
	}

	if ( answers.emptyContent ) {
		wp.purify = true;
	}

	return wp;
}

module.exports = function makeInquirer( { prompt } ) {
	return async ( defaults = {} ) => {
		const {
			name,
			domain,
			mediaProxy,
			php,
			elasticsearch,
			wordpress,
		} = defaults;

		const {
			type: wordpressType,
			title: wordpressTitle,
			username: wordpressUsername,
			password: wordpressPassword,
			email: wordpressEmail,
			purify: wordpressPurify,
		} = wordpress || {};

		const answers = await prompt( [
			{
				name: 'hostname',
				type: 'input',
				message: 'What is the primary hostname for your site? (Ex: docker.test)',
				validate: validateNotEmpty,
				filter: parseHostname,
				when() {
					return ! Array.isArray( domain ) || ! domain.length;
				},
			},
			{
				name: 'addMoreHosts',
				type: 'confirm',
				message: 'Are there additional domains the site should respond to?',
				default: false,
				when() {
					return ! Array.isArray( domain ) || ! domain.length;
				},
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
				choices: phpVersions,
				default: '7.3',
				when() {
					return ! phpVersions.includes( php );
				},
			},
			{
				name: 'wordpress',
				type: 'confirm',
				message: 'Do you want to install WordPress?',
				when: defaultIsUndefined( wordpress ),
			},
			{
				name: 'wordpressType',
				type: 'list',
				message: 'Select a WordPress installation type:',
				choices: wordpressTypes,
				default: 'single',
				when( answers ) {
					const installWp = answers.wordpress === true;
					const wrongType = wordpressType && ! wordpressTypes.map( ( { value } ) => value ).includes( wordpressType );
					return installWp || wrongType;
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
					return answers.wordpress === true || ( wordpress && ! wordpressTitle );
				},
			},
			{
				name: 'username',
				type: 'input',
				message: 'Admin Username',
				default: 'admin',
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true || ( wordpress && ! wordpressUsername );
				},
			},
			{
				name: 'password',
				type: 'input',
				message: 'Admin Password',
				default: 'password',
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true || ( wordpress && ! wordpressPassword );
				},
			},
			{
				name: 'email',
				type: 'input',
				message: 'Admin Email',
				default: 'admin@example.com',
				validate: validateNotEmpty,
				when( answers ) {
					return answers.wordpress === true || ( wordpress && ! wordpressEmail );
				},
			},
			{
				name: 'emptyContent',
				type: 'confirm',
				message: 'Do you want to remove the default content?',
				default: false,
				when( answers ) {
					return answers.wordpress === true || ( wordpress && ! wordpressPurify );
				},
			},
			{
				name: 'mediaProxy',
				type: 'confirm',
				message: 'Do you want to set a proxy for media assets? (i.e. Serving /uploads/ directory assets from a production site)',
				default: false,
				when: defaultIsUndefined( mediaProxy ),
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
				when: defaultIsUndefined( elasticsearch ),
			},
		] );

		return {
			...defaults,
			name: name || answers.title,
			domain: marshalDomains( domain, answers ),
			mediaProxy: answers.proxy || false,
			php: php || answers.phpVersion,
			elasticsearch: elasticsearch || answers.elasticsearch || false,
			wordpress: marshalWordPress( wordpress, answers ),
		};
	};
};
