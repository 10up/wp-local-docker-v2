const { generate } = require( '../../certificates' );

module.exports = function makeCert( spinner ) {
	return async ( envSlug, hosts ) => {
		if ( ! spinner ) {
			console.log( 'Generating certificates:' );
		}

		const certs = await generate( envSlug, hosts ).catch( ( err ) => {
			if ( err && err.message ) {
				if ( spinner ) {
					spinner.warn( err.message );
					spinner.info( 'Failed to create SSL certificates, HTTP version will be created...' );
				} else {
					console.error( err.message );
					console.log( 'Failed to create SSL certificates, HTTP version will be created...' );
				}
			}

			return false;
		} );

		if ( certs ) {
			if ( spinner ) {
				spinner.succeed( 'Certificates are generated...' );
			} else {
				console.log( ' - Done' );
			}
		}

		return certs;
	};
};
