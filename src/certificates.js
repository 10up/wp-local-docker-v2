const { execSync } = require( 'child_process' );
const mkcert = require( 'mkcert-prebuilt' );

function installCA( verbose = false ) {
    execSync( `${ mkcert } -install`, {
        stdio: verbose ? 'inherit' : 'ignore',
    } );
}

module.exports = {
    installCA,
};
