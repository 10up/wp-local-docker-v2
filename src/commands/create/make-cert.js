const { join } = require( 'path' );
const { execSync } = require( 'child_process' );
const { existsSync, promises: fsPromises } = require( 'fs' );

const config = require( '../../configure' );

module.exports = function makeCert( spinner, mkcert, shellEscape ) {
    return async ( envSlug, hosts ) => {
        const { mkdir } = fsPromises;
        const global = join( config.getConfigDirectory(), 'global', 'ssl-certs' );
        if ( ! existsSync( global ) ) {
            mkdir( global, {
                mode: 0o755,
                recursive: true,
            } );
        }

        const filename = join( global, envSlug );
        const certFile = `-cert-file ${ filename }.crt`;
        const keyFile = `-key-file ${ filename }.key`;

        const allHosts = [ ...hosts, ...hosts.map( ( host ) => `*.${ host }` ) ];

        if ( ! spinner ) {
            console.log( 'Generating certificates:' );
        }

        execSync(
            `${ mkcert } ${ certFile } ${ keyFile } ${ shellEscape( allHosts ) }`,
            {
                stdio: spinner ? 'ignore' : 'inherit',
            },
        );

        if ( spinner ) {
            spinner.succeed( 'Certificates are generated...' );
        }
    };
};
