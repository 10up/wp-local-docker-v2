const { execSync } = require( 'child_process' );

module.exports = function makeExecutor( cwd, verbose ) {
    const stdio = verbose ? 'inherit' : 'ignore';

    return ( cmd ) => {
        execSync( cmd, { stdio, cwd } );
    };
};
