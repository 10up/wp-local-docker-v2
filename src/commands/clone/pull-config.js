const { promisify } = require( 'util' );
const { join } = require( 'path' );
const fs = require( 'fs' );

const { success, error } = require( 'log-symbols' );

module.exports = function makePullConfig( cwd, spinner ) {
    const stat = promisify( fs.stat );

    return async ( config ) => {
        const filename = join( cwd, config );
        let configuration = {};
        let modified = false;

        try {
            spinner.start( 'Checking configuration file in the repository...' );
            await stat( filename );

            configuration = require( filename );
            spinner.stopAndPersist( {
                symbol: success,
                text: 'Read configuration file in the repository...',
            } );
        } catch( err ) {
            spinner.stopAndPersist( {
                symbol: error,
                text: 'Configuration file is not found in the repository...',
            } );
        }

        if ( !configuration.hostname ) {
            // ask user
            modified = true;
        }

        if ( modified ) {
            // do you want to save configuration file?
        }

        return configuration;
    };
};
