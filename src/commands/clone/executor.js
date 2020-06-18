const { spawn } = require( 'child_process' );
const { success: symbol } = require( 'log-symbols' );

module.exports = function makeExecutor( cwd, verbose, spinner ) {
    const stdio = verbose ? 'inherit' : 'ignore';

    return ( before, [ cmd, ...args ], after ) => {
        if ( !verbose ) {
            spinner.start( before );
        }

        return new Promise( ( resolve ) => {
            const subprocess = spawn( cmd, args, { stdio, cwd } );

            subprocess.on( 'error', ( err ) => {
                process.stderr.write( `${ err }\n` );
                process.exit( 1 );
            } );

            subprocess.on( 'close', () => {
                if ( !verbose ) {
                    spinner.stopAndPersist( {
                        symbol,
                        text: after,
                    } );
                }

                resolve();
            } );
        } );
    };
};
