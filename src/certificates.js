const { execSync } = require( 'child_process' );
const { join } = require( 'path' );

const mkcert = require( 'mkcert-prebuilt' );
const shellEscape = require( 'shell-escape' );

const envUtil = require( './env-utils' );
const { getSslCertsDirectory } = require( './configure' );

function installCA( verbose = false ) {
    execSync( `${ mkcert } -install`, {
        stdio: verbose ? 'inherit' : 'ignore',
    } );
}

async function generate( envName, hosts, verbose ) {
    const envSlug = envUtil.envSlug( envName );

    const sslDir = await getSslCertsDirectory();
    const filename = join( sslDir, envSlug );
    const certFile = `-cert-file ${ filename }.crt`;
    const keyFile = `-key-file ${ filename }.key`;

    const allHosts = [ ...hosts, ...hosts.map( ( host ) => `*.${ host }` ) ];

    execSync( `${ mkcert } ${ certFile } ${ keyFile } ${ shellEscape( allHosts ) }`, {
        stdio: verbose ? 'inherit' : 'ignore',
    } );
}

module.exports = {
    installCA,
    generate,
};
