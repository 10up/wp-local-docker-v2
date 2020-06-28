const config = require( '../../configure' );

module.exports = function makeUpdateHosts( sudo, spinner ) {
    return async ( hosts ) => {
        const manageHosts = await config.get( 'manageHosts' );
        if ( manageHosts === true ) {
            await new Promise( ( resolve ) => {
                const command = `10updocker-hosts add ${hosts.join( ' ' )}`;
                sudo.exec( command, { name: 'WP Local Docker' }, ( err ) => {
                    if ( err ) {
                        spinner.warn( 'Something went wrong adding host file entries. You may need to add the /etc/hosts entries manually.' );
                    }

                    resolve();
                } );
            } );
        }
    };
};
