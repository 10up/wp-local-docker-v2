const template = `/**
 * The project name.
 *
 * @type {string}
 */
exports.name = {{projectName}};

/**
 * The primary hostname or array of hostnames to use in the project.
 * If multiple domains are neeeded, use array of strings where the first
 * domain is considered as primary.
 *
 * @example
 * exports.domain = "mysite.test";
 * 
 * @example
 * exports.domain = [
 *     "mysite.test",
 *     "store.mysite.test",
 *     "forum.mysite.test",
 * ];
 *
 * @type {string|string[]}
 */
exports.domain = {{domain}};

/**
 * The media proxy URL. If media proxy isn't needed, set it to FALSE.
 *
 * @example
 * exports.mediaProxy = "https://mysite.com"
 *
 * @type {string|boolean}
 */
exports.mediaProxy = {{proxy}};

/**
 * The PHP version to use for the project. Available options are 7.4, 7.3,
 * 7.2, 7.1, 7.0 and 5.6.
 *
 * @type {string}
 */
exports.php = {{phpVersion}};

/**
 * Whether or not to use elasticsearch for the project. If elasticsearch
 * is need set TRUE, otherwise FALSE.
 *
 * @type {boolean}
 */
exports.elasticsearch = {{elasticsearch}};

/**
 * WordPress configuration. Valid types are:
 *  - single
 *  - subdirectory
 *  - subdomain
 *  - dev
 *
 * @example
 * exports.wordpress = {
 *     type: 'subdomain',
 *     title: 'MySite',
 *     username: 'admin',
 *     password: 'password',
 *     email: 'admin@example.com',
 *     purify: true,
 * };
 *
 * @type {Object}
 */
exports.wordpress = {
    type: {{wordpressType}},
    title: {{title}},
    username: {{username}},
    password: {{password}},
    email: {{email}},
    purify: {{emptyContent}},
};

/**
 * The snapshot id to use for the project. If multiple snaphots are available,
 * use array of strings.
 *
 * @example
 * exports.snapshot = "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3";
 * 
 * @example
 * exports.snapshot = [
 *     "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
 *     "109f4b3c50d7b0df729d299bc6f8e9ef9066971f",
 * ];
 * 
 * @example
 * exports.snapshot = {
 *     repository: "myrepo",
 *     snapshot: [
 *         "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
 *         "109f4b3c50d7b0df729d299bc6f8e9ef9066971f",
 *     ],
 * };
 *
 * @type {string|string[]|Object}
 */
exports.snapshot = {{snapshot}};

/**
 * Where to move the project in WordPress directory tree.
 *
 * @example
 * exports.mountPoint = '/wp-content';
 * 
 * @example
 * exports.mountPoint = '/wp-content/plugins/my-plugin';
 * 
 * @example
 * exports.mountPoint = '/wp-content/themes/my-theme';
 *
 * @type {string}
 */
exports.mountPoint = {{mountPoint}};

/**
 * Optional. Instructions to display after cloning this project. Supports simplified
 * markdown:
 *  - headers: #, ##, ###, ####, #####, ######
 *  - lists: *, 1.
 *  - links: [text](url)
 *  - formatting: **bold**, *italic*, _italic_, \`code\`
 *
 * @example
 * # Next Steps:
 * 1. Go to the project folder
 * 1. PHP:
 *    1. Install composer dependencies using \`composer install\`
 * 1. Assets:
 *    1. Install npm dependencies using \`npm i\`
 *    1. Build assets with \`npm run build\`
 * 1. Documentation:
 *    1. [Project Wiki](https://example.com/project/wiki.html)
 *    1. [Engineering Workflow](https://example.com/project/engineering-workflow.html)
 *    1. [Time Tracking](https://example.com/project/time-tracking.html)
 *    1. [Testing](https://example.com/project/testing.html)
 *
 * @type {string}
 */
exports.instructions = \`
\`;

/**
 * Optional. The callback function to modify docker-compose.yml file. Set FALSE
 * if it is not needed.
 *
 * @type {function}
 */
exports.dockerCompose = function( baseConfig ) {
    return baseConfig;
};
`;

module.exports = function makeConfig() {
	return ( answers ) => {
		let config = template;

		Object.keys( answers ).forEach( ( key ) => {
			config = config.split( `{{${ key }}}` ).join( JSON.stringify( answers[ key ] ) );
		} );

		return config;
	};
};
