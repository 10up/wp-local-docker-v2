const { promisify } = require( 'util' );
const { join } = require( 'path' );
const fs = require( 'fs' );

const { success, error } = require( 'log-symbols' );

module.exports = function makePullConfig( cwd, spinner ) {
    const stat = promisify( fs.stat );

    return async ( config ) => {
        const filename = join( cwd, config );

        try {
            spinner.start( 'Checking configuration file in the repository...' );
            await stat( filename );

            const configuration = require( filename );
            spinner.stopAndPersist( {
                symbol: success,
                text: 'Read configuration file in the repository...',
            } );

            return configuration;
        } catch( err ) {
            spinner.stopAndPersist( {
                symbol: error,
                text: 'Configuration file is not found in the repository...',
            } );
        }
    };
};
