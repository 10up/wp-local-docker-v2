const { join } = require( 'path' );
const { stat } = require( 'fs' ).promises;

module.exports = function makePullConfig( spinner ) {
    return async ( cwd, config, defaults = {} ) => {
        try {
            const filename = join( cwd, config );

            spinner.start( 'Checking configuration file in the repository...' );
            await stat( filename );

            const configuration = require( filename );
            spinner.succeed( 'Read configuration file in the repository...' );

            return configuration;
        } catch( err ) {
            spinner.warn( 'Configuration file is not found in the repository...' );
        }

        return defaults;
    };
};
