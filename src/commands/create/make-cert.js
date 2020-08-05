const { generate } = require( '../../certificates' );

module.exports = function makeCert( spinner ) {
    return async ( envSlug, hosts ) => {
        if ( ! spinner ) {
            console.log( 'Generating certificates:' );
        }

        await generate( envSlug, hosts, ! spinner );

        if ( spinner ) {
            spinner.succeed( 'Certificates are generated...' );
        }
    };
};
