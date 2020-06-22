const { promisify } = require( 'util' );
const { join } = require( 'path' );
const fs = require( 'fs' );

module.exports = function makePullConfig( spinner ) {
    const stat = promisify( fs.stat );

    return async ( cwd, config ) => {
        const filename = join( cwd, config );
        let configuration = {};
        let modified = false;

        try {
            spinner.start( 'Checking configuration file in the repository...' );
            await stat( filename );

            configuration = require( filename );
            spinner.succeed( 'Read configuration file in the repository...' );
        } catch( err ) {
            spinner.fail( 'Configuration file is not found in the repository...' );
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
