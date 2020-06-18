const { execSync } = require( 'child_process' );

module.exports = function makeExecutor( cwd ) {
    return ( cmd ) => {
        execSync( cmd, { stdio: 'inherit', cwd } );
    };
};
