const { execSync } = require( 'child_process' );
const mkcert = require( 'mkcert-prebuilt' );

exports.command = 'install';
exports.desc = 'Installs a new local CA in the system trust store.';

exports.handler = function() {
    execSync( `${ mkcert } -install`, { stdio: 'inherit' } );
};
