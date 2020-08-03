const { join } = require( 'path' );
const { existsSync, promises: fsPromises } = require( 'fs' );

const config = require( '../../configure' );

module.exports = function makeCert( mkcert ) {
    return async ( envSlug, hosts ) => {
        const allHosts = [ ...hosts, ...hosts.map( ( host ) => `*.${ host }` ) ];

        const ca = await mkcert.createCA( {
            organization: 'WP Local Docker',
            countryCode: 'US',
            state: 'CA',
            locality: 'Roseville',
            validityDays: 3650
        } );

        const cert = await mkcert.createCert( {
            domains: allHosts,
            validityDays: 3650,
            caKey: ca.key,
            caCert: ca.cert
        } );

        const { writeFile, mkdir } = fsPromises;
        const global = join( config.getConfigDirectory(), 'global', 'ssl-certs' );
        if ( ! existsSync( global ) ) {
            mkdir( global, {
                mode: 0o755,
                recursive: true,
            } );
        }

        await writeFile( join( global, `${ envSlug }.crt` ), cert.cert );
        await writeFile( join( global, `${ envSlug }.key` ), cert.key );
    };
};
