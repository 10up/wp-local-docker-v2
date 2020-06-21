const { spawn } = require( 'child_process' );
const { success: symbol } = require( 'log-symbols' );

module.exports = function makeExecutor( cwd, verbose, spinner ) {
    return ( before, [ cmd, ...args ], after, options = {} ) => {
        if ( ! verbose && before ) {
            spinner.start( before );
        }

        return new Promise( ( resolve ) => {
            const subprocess = spawn( cmd, args, { cwd, ...options } );

            subprocess.on( 'error', ( err ) => {
                throw err;
            } );

            subprocess.on( 'close', ( code ) => {
                if ( ! verbose ) {
                    if ( after ) {
                        spinner.stopAndPersist( { symbol, text: after } );
                    } else if ( spinner.isSpinning ) {
                        spinner.stop();
                    }
                }

                if ( code ) {
                    process.exit( code );
                } else {
                    resolve( subprocess );
                }
            } );
        } );
    };
};
