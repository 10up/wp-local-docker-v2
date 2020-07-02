const { resolve, join } = require( 'path' );

const config = require( '../../configure' );

module.exports = function makeUpdateHosts( which, sudo, spinner ) {
    return async ( hosts ) => {
        const manageHosts = await config.get( 'manageHosts' );
        if ( manageHosts === true ) {
            const node = await which( 'node' );
            const hostsScript = join( resolve( __dirname, '../../..' ), 'hosts.js' );

            await new Promise( ( resolve ) => {
                const command = `${node} ${hostsScript} add ${hosts.join( ' ' )}`;
                sudo.exec( command, { name: 'WP Local Docker' }, ( err ) => {
                    if ( err ) {
                        spinner.warn( 'Something went wrong adding host file entries. You may need to add the /etc/hosts entries manually.' );
                    } else {
                        spinner.succeed( 'Added domains to the hosts file...' );
                        resolve();
                    }
                } );
            } );
        }
    };
};
