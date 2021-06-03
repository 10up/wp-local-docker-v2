const { join } = require( 'path' );
const { stat } = require( 'fs' ).promises;

module.exports = function makePullConfig( spinner ) {
	return async ( cwd, config, defaults = {} ) => {
		try {
			const filename = join( cwd, config );

			await stat( filename );

			const configuration = require( filename );
			if ( spinner ) {
				spinner.succeed( 'Configuration file is read from the repository...' );
			} else {
				console.log( 'Read configuration file' );
			}

			return configuration;
		} catch( err ) {
			if ( spinner ) {
				spinner.warn( 'Configuration file is not found in the repository...' );
			} else {
				console.log( 'Configuration file is not found in the repository' );
			}
		}

		return defaults;
	};
};
