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
 * @type {string|string[]}
 */
exports.domain = {{domain}};

/**
 * The media proxy URL. If media proxy isn't needed, set it to FALSE.
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
 * WordPress configuration.
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
 * @type {string|string[]}
 */
exports.snapshot = {{snapshot}};

/**
 * Where to move the project in WordPress directory tree.
 *
 * @type {string}
 */
exports.mountPoint = {{mountPoint}};

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
