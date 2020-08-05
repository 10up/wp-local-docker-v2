const { join } = require( 'path' );
const { execSync } = require( 'child_process' );

const { getSslCertsDir } = require( '../../configure' );

module.exports = function makeCert( spinner, mkcert, shellEscape ) {
    return async ( envSlug, hosts ) => {
        const sslDir = await getSslCertsDir();
        const filename = join( sslDir, envSlug );
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
